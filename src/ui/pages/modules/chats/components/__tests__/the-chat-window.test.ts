import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

const route = reactive({
	params: {
		threadId: 'thread-1',
	},
});

vi.mock('vue-router', () => ({
	useRoute: () => route,
}));

type FakeTask = ReturnType<typeof makeTask>;
const tasksByThread = reactive<Record<string, FakeTask>>({});

// The real chats store pulls the socket client, router and offers in; the
// window only needs the thread -> task lookup.
vi.mock('../../../../../../features/chats/store/chats', () => ({
	useChatsStore: () => ({
		getTaskByThreadId: (id: string) => tasksByThread[id],
	}),
}));

vi.mock('@webitel/ui-sdk/components', () => ({
	WtTabs: {
		name: 'WtTabs',
		props: [
			'current',
			'tabs',
		],
		emits: [
			'change',
		],
		template: '<nav class="wt-tabs-stub" />',
	},
}));

vi.mock('../the-chat-thread.vue', () => ({
	default: {
		name: 'TheChatThread',
		template: '<div class="thread-stub" />',
	},
}));

vi.mock(
	'../../../../../../features/processing/components/the-processing-form.vue',
	() => ({
		default: {
			name: 'TheProcessingForm',
			props: [
				'task',
			],
			template: '<div class="processing-form-stub" />',
		},
	}),
);

vi.mock(
	'../../../../../../features/chats/components/chat-info/chat-info.vue',
	() => ({
		default: {
			name: 'ChatInfo',
			props: [
				'task',
				'threadId',
			],
			template: '<div class="info-stub" />',
		},
	}),
);

vi.mock(
	'../../../../../../features/chats/components/chat-top-bar/chat-top-bar.vue',
	() => ({
		default: {
			name: 'ChatTopBar',
			props: [
				'task',
			],
			template: '<div class="top-bar-stub" />',
		},
	}),
);

import TheChatWindow from '../the-chat-window.vue';

let nextId = 1;

function makeTask({ withForm = false, state = 'bridged' } = {}) {
	return reactive({
		id: nextId++,
		hasForm: withForm,
		state,
		form: withForm
			? {
					metadata: {
						isInited: true,
					},
					actions: [],
					body: [],
				}
			: null,
	});
}

const mountWindow = () =>
	mount(TheChatWindow, {
		global: {
			plugins: [
				createTestingPinia({
					stubActions: false,
					createSpy: vi.fn,
				}),
			],
		},
	});

type StripTab = {
	value: string;
	text: string;
	disabled?: boolean;
};

const tabsOf = (wrapper: ReturnType<typeof mountWindow>) =>
	wrapper
		.findComponent({
			name: 'WtTabs',
		})
		.props('tabs') as StripTab[];

const tabValues = (wrapper: ReturnType<typeof mountWindow>) =>
	tabsOf(wrapper).map((tab) => tab.value);

const selectTab = async (
	wrapper: ReturnType<typeof mountWindow>,
	value: string,
) => {
	const tab = tabsOf(wrapper).find((candidate) => candidate.value === value);
	wrapper
		.findComponent({
			name: 'WtTabs',
		})
		.vm.$emit('change', tab);
	await nextTick();
};

const showsForm = (wrapper: ReturnType<typeof mountWindow>) =>
	wrapper.find('.processing-form-stub').exists();

describe('the-chat-window', () => {
	beforeEach(() => {
		route.params.threadId = 'thread-1';
		for (const key of Object.keys(tasksByThread)) delete tasksByThread[key];
	});

	it('always shows the tab strip, without the post-processing tab while there is no form', () => {
		tasksByThread['thread-1'] = makeTask();

		const wrapper = mountWindow();

		expect(tabValues(wrapper)).toEqual([
			'chat',
			'info',
			'interaction',
			'contact',
			'iframe',
		]);
		expect(wrapper.find('.thread-stub').exists()).toBe(true);
	});

	it('labels the tabs from the locale', () => {
		tasksByThread['thread-1'] = makeTask({
			withForm: true,
		});

		const wrapper = mountWindow();

		expect(tabsOf(wrapper).map((tab) => tab.text)).toEqual([
			'ui.pages.chats.tabs.chat',
			'ui.pages.chats.tabs.info',
			'ui.pages.chats.tabs.postProcessing',
			'ui.pages.chats.tabs.interaction',
			'ui.pages.chats.tabs.contact',
			'ui.pages.chats.tabs.iframe',
		]);
	});

	it('opens the info panel for the open chat and its task', async () => {
		const task = makeTask();
		tasksByThread['thread-1'] = task;
		const wrapper = mountWindow();

		await selectTab(wrapper, 'info');

		const info = wrapper.findComponent({
			name: 'ChatInfo',
		});
		expect(info.exists()).toBe(true);
		expect(info.props('threadId')).toBe('thread-1');
		expect(info.props('task')).toStrictEqual(task);
		expect(wrapper.find('.thread-stub').exists()).toBe(false);
	});

	it('marks the tabs whose content is not built yet as disabled, and ignores selecting them', async () => {
		tasksByThread['thread-1'] = makeTask();
		const wrapper = mountWindow();

		expect(
			tabsOf(wrapper)
				.filter((tab) => tab.disabled)
				.map((tab) => tab.value),
		).toEqual([
			'interaction',
			'contact',
			'iframe',
		]);

		for (const value of [
			'interaction',
			'contact',
			'iframe',
		]) {
			await selectTab(wrapper, value);
			expect(wrapper.find('.thread-stub').exists()).toBe(true);
		}
	});

	it('adds the post-processing tab when a form arrives mid-chat, without switching to it', async () => {
		const task = makeTask();
		tasksByThread['thread-1'] = task;
		const wrapper = mountWindow();

		task.hasForm = true;
		task.form = {
			metadata: {
				isInited: true,
			},
			actions: [],
			body: [],
		};
		await nextTick();

		expect(tabValues(wrapper)).toEqual([
			'chat',
			'info',
			'processing',
			'interaction',
			'contact',
			'iframe',
		]);
		expect(showsForm(wrapper)).toBe(false);
	});

	it('switches to the form when the chat ends with one waiting', async () => {
		const task = makeTask({
			withForm: true,
		});
		tasksByThread['thread-1'] = task;
		const wrapper = mountWindow();
		expect(showsForm(wrapper)).toBe(false);

		task.state = 'processing';
		await nextTick();

		expect(showsForm(wrapper)).toBe(true);
		// the bar carries the countdown and sits above the panels, so the form tab
		// still shows it
		expect(wrapper.find('.top-bar-stub').exists()).toBe(true);
	});

	it('opens a chat already in post-processing on its form', async () => {
		tasksByThread['thread-1'] = makeTask();
		tasksByThread['thread-2'] = makeTask({
			withForm: true,
			state: 'processing',
		});
		const wrapper = mountWindow();

		route.params.threadId = 'thread-2';
		await nextTick();

		expect(showsForm(wrapper)).toBe(true);
	});

	it('falls back to the chat tab once the form is gone', async () => {
		const task = makeTask({
			withForm: true,
			state: 'processing',
		});
		tasksByThread['thread-1'] = task;
		const wrapper = mountWindow();
		expect(showsForm(wrapper)).toBe(true);

		task.form = null;
		await nextTick();

		expect(showsForm(wrapper)).toBe(false);
		expect(tabValues(wrapper)).not.toContain('processing');
	});
});
