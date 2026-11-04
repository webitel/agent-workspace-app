import { createTestingPinia } from '@pinia/testing';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
const feed = reactive({
	isTaskFeedReady: true,
});

// The real chats store pulls the socket client, router and offers in; the
// window only needs the thread -> task lookup and whether the feed is back.
vi.mock('../../../../../../features/chats/store/chats', () => ({
	useChatsStore: () => ({
		get isTaskFeedReady() {
			return feed.isTaskFeedReady;
		},
		hasChatTask: (id: string) => Boolean(tasksByThread[id]),
		getTaskByThreadId: (id: string) => tasksByThread[id],
	}),
}));

type FakeClosedChat = {
	thread: object | null;
	messages: object[];
	hasMore: boolean;
	isLoading: boolean;
	isNotFound: boolean;
	error: unknown;
	load: ReturnType<typeof vi.fn>;
	loadMore: ReturnType<typeof vi.fn>;
};
// one fake per thread, like the real registry
const closedChats = new Map<string, FakeClosedChat>();

const createClosedChat = (id: string, messages: object[] = []) =>
	reactive<FakeClosedChat>({
		thread: {
			id,
			members: [],
		},
		messages,
		hasMore: false,
		isLoading: false,
		isNotFound: false,
		error: null,
		load: vi.fn(),
		loadMore: vi.fn(),
	});

vi.mock(
	'../../../../../../features/chats/modules/closed/store/closed-chat',
	() => ({
		useClosedChatStore: (id: string) => {
			let closedChat = closedChats.get(id);
			if (!closedChat) {
				closedChat = createClosedChat(id);
				closedChats.set(id, closedChat);
			}
			return closedChat;
		},
	}),
);

// The closed thread is rendered for real, so the window is seen rebinding it
// to the route; ChatThread itself is a stub (its real entry pulls svg?raw).
vi.mock('@webitel/ui-chats/v2', () => ({
	ChatThreadMode: {
		Awaiting: 'awaiting',
		Active: 'active',
		Readonly: 'readonly',
	},
	ChatThread: {
		name: 'ChatThread',
		props: [
			'thread',
			'messages',
			'selfMemberId',
			'mode',
			'hasMore',
		],
		template: '<div class="chat-thread-stub" />',
	},
}));

vi.mock('@webitel/ui-sdk/components', () => ({
	WtDivider: {
		name: 'WtDivider',
		template: '<hr />',
	},
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
	WtLoader: {
		name: 'WtLoader',
		template: '<div class="loader-stub" />',
	},
	WtEmpty: {
		name: 'WtEmpty',
		props: [
			'image',
			'text',
			'primaryActionText',
		],
		emits: [
			'click:primary',
		],
		template: '<div class="empty-stub" />',
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
				'closedThreadVariables',
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

vi.mock(
	'../../../../../../features/chats/modules/closed/components/closed-chat-top-bar.vue',
	() => ({
		default: {
			name: 'ClosedChatTopBar',
			props: [
				'thread',
			],
			template: '<div class="closed-top-bar-stub" />',
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

// a window left mounted would keep following the shared route and feed, and
// load closed chats on a later test's behalf
enableAutoUnmount(afterEach);

describe('the-chat-window', () => {
	beforeEach(() => {
		route.params.threadId = 'thread-1';
		for (const key of Object.keys(tasksByThread)) delete tasksByThread[key];
		feed.isTaskFeedReady = true;
		closedChats.clear();
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

	it('does not mark the info panel of an active chat closed', async () => {
		tasksByThread['thread-1'] = makeTask();
		const wrapper = mountWindow();
		await selectTab(wrapper, 'info');

		expect(
			wrapper
				.findComponent({
					name: 'ChatInfo',
				})
				.props('closedThreadVariables'),
		).toBeUndefined();
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

	describe('a chat no task backs', () => {
		const showsClosedThread = (wrapper: ReturnType<typeof mountWindow>) =>
			wrapper.find('.the-closed-chat-thread').exists();

		// a deep-linked active chat must not flash as closed (ADR-0010)
		it('waits for the task feed before showing anything', () => {
			feed.isTaskFeedReady = false;

			const wrapper = mountWindow();

			expect(wrapper.find('.loader-stub').exists()).toBe(true);
			expect(wrapper.find('.wt-tabs-stub').exists()).toBe(false);
			expect(showsClosedThread(wrapper)).toBe(false);
			expect(closedChats.size).toBe(0);
		});

		it('shows the closed chat once the feed is ready', async () => {
			feed.isTaskFeedReady = false;
			const wrapper = mountWindow();

			feed.isTaskFeedReady = true;
			await nextTick();

			expect(closedChats.get('thread-1')?.load).toHaveBeenCalledOnce();
			expect(showsClosedThread(wrapper)).toBe(true);
			expect(wrapper.find('.thread-stub').exists()).toBe(false);
			// the active bar is for a task, and there is none
			expect(wrapper.find('.top-bar-stub').exists()).toBe(false);
			expect(
				wrapper
					.findComponent({
						name: 'ClosedChatTopBar',
					})
					.props('thread'),
			).toBe(closedChats.get('thread-1')?.thread);
		});

		it('shows no top bar until the closed chat has its thread', async () => {
			const wrapper = mountWindow();
			const closedChat = closedChats.get('thread-1') as FakeClosedChat;
			closedChat.thread = null;
			closedChat.isLoading = true;
			await nextTick();

			expect(wrapper.find('.closed-top-bar-stub').exists()).toBe(false);
		});

		it('shows Post-processing disabled, and ignores selecting it', async () => {
			const wrapper = mountWindow();

			expect(tabValues(wrapper)).toEqual([
				'chat',
				'info',
				'processing',
				'interaction',
				'contact',
				'iframe',
			]);
			expect(
				tabsOf(wrapper)
					.filter((tab) => tab.disabled)
					.map((tab) => tab.value),
			).toEqual([
				'processing',
				'interaction',
				'contact',
				'iframe',
			]);

			await selectTab(wrapper, 'processing');
			expect(showsClosedThread(wrapper)).toBe(true);
		});

		it("gives the Info tab the left thread's variables, and no task", async () => {
			const wrapper = mountWindow();
			const closedChat = closedChats.get('thread-1') as FakeClosedChat;
			const variables = {
				Region: {
					value: 'EU',
				},
			};
			closedChat.thread = {
				id: 'thread-1',
				members: [],
				variables: {
					variables,
				},
			};
			await selectTab(wrapper, 'info');

			const info = wrapper.findComponent({
				name: 'ChatInfo',
			});
			expect(info.props('closedThreadVariables')).toEqual(variables);
			expect(info.props('task')).toBeUndefined();
		});

		it('still marks the Info tab closed when the thread has no variables', async () => {
			const wrapper = mountWindow();
			await selectTab(wrapper, 'info');

			expect(
				wrapper
					.findComponent({
						name: 'ChatInfo',
					})
					.props('closedThreadVariables'),
			).toEqual({});
		});

		it('shows the loader until the closed chat has its thread', async () => {
			const wrapper = mountWindow();
			const closedChat = closedChats.get('thread-1') as FakeClosedChat;
			closedChat.thread = null;
			closedChat.isLoading = true;
			await nextTick();

			expect(wrapper.find('.loader-stub').exists()).toBe(true);
			expect(showsClosedThread(wrapper)).toBe(false);
		});

		it('says the chat is not found when the agent never left it either', async () => {
			const wrapper = mountWindow();
			const closedChat = closedChats.get('thread-1') as FakeClosedChat;
			closedChat.thread = null;
			closedChat.isNotFound = true;
			await nextTick();

			const empty = wrapper.findComponent({
				name: 'WtEmpty',
			});
			expect(empty.exists()).toBe(true);
			expect(empty.props('text')).toBe('ui.pages.chats.closed.notFound');
			expect(wrapper.find('.wt-tabs-stub').exists()).toBe(false);
		});

		it('says the chat could not be loaded when its read fails', async () => {
			const wrapper = mountWindow();
			const closedChat = closedChats.get('thread-1') as FakeClosedChat;
			closedChat.thread = null;
			closedChat.error = new Error('offline');
			await nextTick();

			const empty = wrapper.findComponent({
				name: 'WtEmpty',
			});
			expect(empty.exists()).toBe(true);
			expect(empty.props('text')).toBe('ui.pages.chats.closed.loadError');
			expect(showsClosedThread(wrapper)).toBe(false);
		});

		// the read can race the backend recording the leave of a chat that just
		// turned closed in place, and the window stays open meanwhile
		it.each([
			[
				'not found',
				(closedChat: FakeClosedChat) => {
					closedChat.isNotFound = true;
				},
			],
			[
				'a failed read',
				(closedChat: FakeClosedChat) => {
					closedChat.error = new Error('offline');
				},
			],
		])('reads the closed chat again on retry after %s', async (_name, fail) => {
			const wrapper = mountWindow();
			const closedChat = closedChats.get('thread-1') as FakeClosedChat;
			closedChat.thread = null;
			fail(closedChat);
			closedChat.load.mockImplementation(() => {
				closedChat.isNotFound = false;
				closedChat.error = null;
				closedChat.thread = {
					id: 'thread-1',
					members: [],
				};
			});
			await nextTick();
			const empty = wrapper.findComponent({
				name: 'WtEmpty',
			});
			expect(empty.props('primaryActionText')).toBe(
				'ui.pages.chats.closed.retry',
			);
			expect(closedChat.load).toHaveBeenCalledTimes(1);

			empty.vm.$emit('click:primary');
			await nextTick();

			expect(closedChat.load).toHaveBeenCalledTimes(2);
			expect(
				wrapper
					.findComponent({
						name: 'WtEmpty',
					})
					.exists(),
			).toBe(false);
			expect(showsClosedThread(wrapper)).toBe(true);
		});

		// a closed chat read before the agent rejoined is dropped by the
		// coordinator, so the window only has to read what is there
		it('turns into the closed chat in place when the task leaves', async () => {
			tasksByThread['thread-1'] = makeTask();
			const wrapper = mountWindow();
			expect(wrapper.find('.thread-stub').exists()).toBe(true);

			delete tasksByThread['thread-1'];
			await nextTick();

			expect(closedChats.get('thread-1')?.load).toHaveBeenCalledOnce();
			expect(showsClosedThread(wrapper)).toBe(true);
			expect(wrapper.find('.thread-stub').exists()).toBe(false);
		});

		it('follows the route from one closed chat to another', async () => {
			closedChats.set(
				'thread-1',
				createClosedChat('thread-1', [
					{
						id: 'm-1',
					},
				]),
			);
			closedChats.set(
				'thread-2',
				createClosedChat('thread-2', [
					{
						id: 'm-2',
					},
				]),
			);
			const wrapper = mountWindow();
			const chatThread = () =>
				wrapper.findComponent({
					name: 'ChatThread',
				});
			expect(chatThread().props('thread')).toMatchObject({
				id: 'thread-1',
			});

			route.params.threadId = 'thread-2';
			await nextTick();

			expect(closedChats.get('thread-2')?.load).toHaveBeenCalledOnce();
			expect(chatThread().props('thread')).toMatchObject({
				id: 'thread-2',
			});
			expect(chatThread().props('messages')).toEqual([
				{
					id: 'm-2',
				},
			]);
			expect(chatThread().props('mode')).toBe('readonly');
		});
	});
});
