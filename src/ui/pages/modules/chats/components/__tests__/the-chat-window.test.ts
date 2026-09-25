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
	'../../../../../../features/processing/components/post-processing-chip.vue',
	() => ({
		default: {
			name: 'PostProcessingChip',
			props: [
				'task',
			],
			template: '<div class="chip-stub" />',
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

const tabValues = (wrapper: ReturnType<typeof mountWindow>) =>
	(
		wrapper
			.findComponent({
				name: 'WtTabs',
			})
			.props('tabs') as {
			value: string;
		}[]
	).map((tab) => tab.value);

const showsForm = (wrapper: ReturnType<typeof mountWindow>) =>
	wrapper.find('.processing-form-stub').exists();

describe('the-chat-window', () => {
	beforeEach(() => {
		route.params.threadId = 'thread-1';
		for (const key of Object.keys(tasksByThread)) delete tasksByThread[key];
	});

	it('always shows the tab strip, with only the chat tab while there is no form', () => {
		tasksByThread['thread-1'] = makeTask();

		const wrapper = mountWindow();

		expect(tabValues(wrapper)).toEqual([
			'chat',
		]);
		expect(wrapper.find('.thread-stub').exists()).toBe(true);
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
			'processing',
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
		// the countdown lives beside the panels, so the form tab still shows it
		expect(wrapper.find('.chip-stub').exists()).toBe(true);
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
		expect(tabValues(wrapper)).toEqual([
			'chat',
		]);
	});
});
