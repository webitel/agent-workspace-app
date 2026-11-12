import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref, shallowRef } from 'vue';

type FakeTask = {
	id: number;
	thread?: {
		id: string;
	};
};

const chatTaskList = ref<FakeTask[]>([]);
const isTaskFeedReady = ref(true);
vi.mock('../../../../store/chats', () => ({
	useChatsStore: () => ({
		get chatTaskList() {
			return chatTaskList.value;
		},
		get isTaskFeedReady() {
			return isTaskFeedReady.value;
		},
		getTaskByThreadId: (threadId: string) =>
			chatTaskList.value.find((task) => task.thread?.id === threadId),
	}),
}));

const syncMock = vi.fn();
const receiveThreadMock = vi.fn();
const seedMock = vi.fn();
const unreadByThread = ref<Record<string, number>>({});
vi.mock('../chat-previews', () => ({
	useChatPreviewsStore: () => ({
		sync: syncMock,
		receiveThread: receiveThreadMock,
		seed: seedMock,
		isUnread: (threadId: string) => (unreadByThread.value[threadId] ?? 0) > 0,
	}),
}));

const isFilteringUnread = ref(false);
const setOnlyUnreadMock = vi.fn((value: boolean) => {
	isFilteringUnread.value = value;
});
const toggleOnlyUnreadMock = vi.fn(() => {
	isFilteringUnread.value = !isFilteringUnread.value;
});
vi.mock('../chat-active', () => ({
	useChatActiveStore: () => ({
		get count() {
			return 7;
		},
		get unreadCount() {
			return 4;
		},
		get isFilteringUnread() {
			return isFilteringUnread.value;
		},
		setOnlyUnread: setOnlyUnreadMock,
		toggleOnlyUnread: toggleOnlyUnreadMock,
	}),
}));

const snoozedThreadIds = shallowRef<ReadonlySet<string>>(new Set());
vi.mock('../chat-snoozed', () => ({
	useChatSnoozedStore: () => ({
		get threadIds() {
			return snoozedThreadIds.value;
		},
		get count() {
			return 3;
		},
		isSnoozed: (threadId: string) => snoozedThreadIds.value.has(threadId),
	}),
}));

const fetchChatListPageMock = vi.fn();
vi.mock('../../api/fetchChatListPage', () => ({
	fetchChatListPage: (...args: unknown[]) => fetchChatListPageMock(...args),
}));

import type { IMessage } from '../../../../types/ChatSession.types';
import { ChatListTab } from '../../enums/ChatListTab.enum';
import { useChatListStore } from '../chat-list';

const PAGE_SIZE = 2;

/**
 * The chat backend's thread list, newest activity first: answers a page of the
 * asked ids, split by the snoozed tag and narrowed like the real one.
 */
const backend = {
	order: [] as string[],
	matching: null as Set<string> | null,
};

function answerPage({
	tab,
	threadIds,
	query,
	onlyUnread,
	page,
}: {
	tab: ChatListTab;
	threadIds: string[];
	query: string;
	onlyUnread: boolean;
	page: number;
}) {
	const asked = new Set(threadIds);
	const rows = backend.order.filter(
		(id) =>
			asked.has(id) &&
			snoozedThreadIds.value.has(id) === (tab === ChatListTab.Snoozed) &&
			(!query || backend.matching?.has(id)) &&
			(!onlyUnread || (unreadByThread.value[id] ?? 0) > 0),
	);
	const start = (page - 1) * PAGE_SIZE;
	return Promise.resolve({
		threads: rows.slice(start, start + PAGE_SIZE).map((id) => ({
			id,
		})),
		next: start + PAGE_SIZE < rows.length,
	});
}

const buildChats = (...threadIds: string[]): FakeTask[] =>
	threadIds.map((threadId, index) => ({
		id: index + 1,
		thread: {
			id: threadId,
		},
	}));

const shown = (store: ReturnType<typeof useChatListStore>) =>
	store.currentTasks.map((task) => task.thread?.id);

const message = (threadId: string, overrides: Record<string, unknown> = {}) =>
	({
		id: `m-${threadId}`,
		threadId,
		...overrides,
	}) as unknown as IMessage;

async function listOf(...threadIds: string[]) {
	chatTaskList.value = buildChats(...threadIds);
	backend.order = [
		...threadIds,
	];
	const store = useChatListStore();
	await flushPromises();
	return store;
}

describe('chat-list store', () => {
	beforeEach(() => {
		syncMock.mockReset();
		receiveThreadMock.mockReset();
		seedMock.mockReset();
		setOnlyUnreadMock.mockClear();
		toggleOnlyUnreadMock.mockClear();
		fetchChatListPageMock.mockReset();
		fetchChatListPageMock.mockImplementation(answerPage);
		chatTaskList.value = [];
		isTaskFeedReady.value = true;
		unreadByThread.value = {};
		isFilteringUnread.value = false;
		snoozedThreadIds.value = new Set();
		backend.order = [];
		backend.matching = null;
		setActivePinia(createPinia());
	});

	// the store's watchers read the shared refs, so a store left running would
	// keep reacting in every later test
	afterEach(() => {
		useChatListStore().$dispose();
	});

	describe('chat previews', () => {
		it('gives the previews the thread ids of every listed chat', () => {
			chatTaskList.value = buildChats('t1', 't2', 't3');

			useChatListStore();

			expect(syncMock).toHaveBeenLastCalledWith([
				't1',
				't2',
				't3',
			]);
		});

		// a task with no thread has no history to read
		it('leaves out a chat without a thread', () => {
			chatTaskList.value = [
				{
					id: 1,
				},
				...buildChats('t2'),
			];

			useChatListStore();

			expect(syncMock).toHaveBeenLastCalledWith([
				't2',
			]);
		});

		it('hands every row of a page to the previews', async () => {
			await listOf('t1', 't2');

			expect(receiveThreadMock.mock.calls.map(([thread]) => thread.id)).toEqual(
				[
					't1',
					't2',
				],
			);
		});
	});

	describe('paging', () => {
		it('opens on the first page of the Active tab', async () => {
			const store = await listOf('t1', 't2', 't3');

			expect(store.currentTab).toBe(ChatListTab.Active);
			expect(shown(store)).toEqual([
				't1',
				't2',
			]);
			expect(store.hasNext).toBe(true);
		});

		it('reads the next page on demand, until there is none', async () => {
			const store = await listOf('t1', 't2', 't3');

			await store.loadNext();

			expect(shown(store)).toEqual([
				't1',
				't2',
				't3',
			]);
			expect(store.hasNext).toBe(false);

			await store.loadNext();
			expect(fetchChatListPageMock).toHaveBeenCalledTimes(2);
		});

		it('scopes every page to the listed chats', async () => {
			await listOf('t1', 't2');

			expect(fetchChatListPageMock).toHaveBeenCalledWith(
				expect.objectContaining({
					tab: ChatListTab.Active,
					threadIds: [
						't1',
						't2',
					],
					page: 1,
				}),
			);
		});

		// the pages are scoped to the listed chats, which the feed says
		it('reads nothing before the task feed has arrived, then the first page', async () => {
			isTaskFeedReady.value = false;
			const store = await listOf('t1');
			expect(fetchChatListPageMock).not.toHaveBeenCalled();

			isTaskFeedReady.value = true;
			await flushPromises();

			expect(shown(store)).toEqual([
				't1',
			]);
		});

		it('drops a row whose chat left the feed while the page was read', async () => {
			chatTaskList.value = buildChats('t1');
			backend.order = [
				't1',
				'gone',
			];
			fetchChatListPageMock.mockImplementation(async (params) =>
				answerPage({
					...params,
					threadIds: [
						't1',
						'gone',
					],
				}),
			);

			const store = useChatListStore();
			await flushPromises();

			expect(shown(store)).toEqual([
				't1',
			]);
		});

		it('keeps the rows when a page fails, and reports it', async () => {
			const store = await listOf('t1', 't2', 't3');
			fetchChatListPageMock.mockRejectedValueOnce(new Error('boom'));

			await store.loadNext();

			expect(shown(store)).toEqual([
				't1',
				't2',
			]);
			expect(store.loadError).toBeInstanceOf(Error);
			expect(store.hasNext).toBe(true);

			await store.loadNext();
			expect(shown(store)).toHaveLength(3);
			expect(store.loadError).toBeNull();
		});
	});

	describe('tabs', () => {
		it('reads the Snoozed tab when it is first opened', async () => {
			snoozedThreadIds.value = new Set([
				't3',
			]);
			const store = await listOf('t1', 't2', 't3');

			store.setTab(ChatListTab.Snoozed);
			await flushPromises();

			expect(shown(store)).toEqual([
				't3',
			]);
		});

		it('keeps what each tab has read when switching back', async () => {
			snoozedThreadIds.value = new Set([
				't9',
			]);
			const store = await listOf('t1', 't2', 't3', 't9');
			await store.loadNext();

			store.setTab(ChatListTab.Snoozed);
			await flushPromises();
			store.setTab(ChatListTab.Active);
			await flushPromises();

			expect(shown(store)).toEqual([
				't1',
				't2',
				't3',
			]);
			expect(fetchChatListPageMock).toHaveBeenCalledTimes(3);
		});
	});

	describe('search', () => {
		it('reads the tab again from its first page with the search', async () => {
			const store = await listOf('t1', 't2', 't3');
			backend.matching = new Set([
				't3',
			]);

			store.setQuery('  anna ');
			await flushPromises();

			expect(store.query).toBe('anna');
			expect(fetchChatListPageMock).toHaveBeenLastCalledWith(
				expect.objectContaining({
					query: 'anna',
					page: 1,
				}),
			);
			expect(shown(store)).toEqual([
				't3',
			]);
		});

		it('does not read again for the same search', async () => {
			const store = await listOf('t1');
			store.setQuery('anna');
			await flushPromises();

			store.setQuery('anna ');
			await flushPromises();

			expect(fetchChatListPageMock).toHaveBeenCalledTimes(2);
		});

		it('reads the other tab with the search when it is opened', async () => {
			snoozedThreadIds.value = new Set([
				't8',
				't9',
			]);
			const store = await listOf('t1', 't8', 't9');
			store.setTab(ChatListTab.Snoozed);
			await flushPromises();
			store.setTab(ChatListTab.Active);
			backend.matching = new Set([
				't9',
			]);

			store.setQuery('anna');
			await flushPromises();
			store.setTab(ChatListTab.Snoozed);
			await flushPromises();

			expect(shown(store)).toEqual([
				't9',
			]);
		});

		// a page asked for an older search must not land on the new one
		it('drops a page that answers after the search changed', async () => {
			const store = await listOf('t1', 't2', 't3');
			let answerOld: (page: unknown) => void = () => {};
			fetchChatListPageMock.mockReturnValueOnce(
				new Promise((resolve) => {
					answerOld = resolve;
				}),
			);
			void store.loadNext();

			backend.matching = new Set([
				't2',
			]);
			store.setQuery('anna');
			await flushPromises();
			answerOld({
				threads: [
					{
						id: 't3',
					},
				],
				next: false,
			});
			await flushPromises();

			expect(shown(store)).toEqual([
				't2',
			]);
		});
	});

	describe('unread filter', () => {
		it('switches the filter on Active and reads it again', async () => {
			unreadByThread.value = {
				t2: 1,
			};
			const store = await listOf('t1', 't2');

			store.toggleOnlyUnread();
			await flushPromises();

			expect(toggleOnlyUnreadMock).toHaveBeenCalledOnce();
			expect(fetchChatListPageMock).toHaveBeenLastCalledWith(
				expect.objectContaining({
					onlyUnread: true,
					page: 1,
				}),
			);
			expect(shown(store)).toEqual([
				't2',
			]);
		});

		// AC_02.02.04
		it('hands the agent over to Active with the filter on, from Snoozed', async () => {
			unreadByThread.value = {
				t2: 1,
			};
			const store = await listOf('t1', 't2');
			store.setTab(ChatListTab.Snoozed);
			await flushPromises();

			store.toggleOnlyUnread();
			await flushPromises();

			expect(store.currentTab).toBe(ChatListTab.Active);
			expect(setOnlyUnreadMock).toHaveBeenCalledWith(true);
			expect(toggleOnlyUnreadMock).not.toHaveBeenCalled();
			expect(shown(store)).toEqual([
				't2',
			]);
		});
	});

	describe('live updates', () => {
		it('moves a chat with a new message to the top of Active', async () => {
			const store = await listOf('t1', 't2');

			store.receiveMessage(message('t2'));

			expect(shown(store)).toEqual([
				't2',
				't1',
			]);
		});

		it('puts a chat no page has brought yet at the top', async () => {
			const store = await listOf('t1', 't2', 't3');

			store.receiveMessage(message('t3'));

			expect(shown(store)).toEqual([
				't3',
				't1',
				't2',
			]);
		});

		it('does not show a page twice that a moved chat sits on', async () => {
			const store = await listOf('t1', 't2', 't3');
			store.receiveMessage(message('t3'));

			await store.loadNext();

			expect(shown(store)).toEqual([
				't3',
				't1',
				't2',
			]);
		});

		it('does not move on a system notice, nor for a chat that is not listed', async () => {
			const store = await listOf('t1', 't2');

			store.receiveMessage(
				message('t2', {
					system: {
						memberJoined: {},
					},
				}),
			);
			store.receiveMessage(message('internal'));

			expect(shown(store)).toEqual([
				't1',
				't2',
			]);
		});

		// the backend searches, so whether it matches cannot be told here
		it('does not put in a chat no page brought while a search is on', async () => {
			const store = await listOf('t1', 't2', 't3');
			backend.matching = new Set([
				't1',
			]);
			store.setQuery('anna');
			await flushPromises();

			store.receiveMessage(message('t3'));

			expect(shown(store)).toEqual([
				't1',
			]);
		});

		it('puts in only an unread chat while the unread filter is on', async () => {
			unreadByThread.value = {
				t1: 1,
			};
			const store = await listOf('t1', 't2', 't3');
			store.toggleOnlyUnread();
			await flushPromises();

			store.receiveMessage(message('t2'));
			unreadByThread.value = {
				t1: 1,
				t3: 1,
			};
			store.receiveMessage(message('t3'));

			expect(shown(store)).toEqual([
				't3',
				't1',
			]);
		});

		it('moves a snoozed chat over to the Snoozed tab, and back when woken', async () => {
			const store = await listOf('t1', 't2');
			store.setTab(ChatListTab.Snoozed);
			await flushPromises();
			store.setTab(ChatListTab.Active);

			snoozedThreadIds.value = new Set([
				't2',
			]);
			await nextTick();
			expect(shown(store)).toEqual([
				't1',
			]);
			store.setTab(ChatListTab.Snoozed);
			expect(shown(store)).toEqual([
				't2',
			]);

			// AC_02.02.05
			snoozedThreadIds.value = new Set();
			await nextTick();
			expect(shown(store)).toEqual([]);
			store.setTab(ChatListTab.Active);
			expect(shown(store)).toEqual([
				't2',
				't1',
			]);
		});

		it('takes a chat out of both tabs when it leaves the feed', async () => {
			const store = await listOf('t1', 't2');

			chatTaskList.value = buildChats('t1');
			await nextTick();

			expect(shown(store)).toEqual([
				't1',
			]);
		});

		it('reads an accepted chat on its own and puts it at the top', async () => {
			const store = await listOf('t1');

			chatTaskList.value = buildChats('t1', 'new');
			backend.order = [
				'new',
				't1',
			];
			await flushPromises();

			expect(fetchChatListPageMock).toHaveBeenLastCalledWith(
				expect.objectContaining({
					threadIds: [
						'new',
					],
				}),
			);
			expect(receiveThreadMock).toHaveBeenLastCalledWith({
				id: 'new',
			});
			expect(shown(store)).toEqual([
				'new',
				't1',
			]);
		});

		it('shows an accepted chat even when reading it fails', async () => {
			const store = await listOf('t1');
			fetchChatListPageMock.mockRejectedValueOnce(new Error('boom'));

			chatTaskList.value = buildChats('t1', 'new');
			await flushPromises();

			expect(seedMock).toHaveBeenCalledWith('new');
			expect(shown(store)).toEqual([
				'new',
				't1',
			]);
		});

		it('reads the open tab again from its first page on reload', async () => {
			const store = await listOf('t1', 't2', 't3');
			await store.loadNext();

			store.reload();
			await flushPromises();

			expect(fetchChatListPageMock).toHaveBeenLastCalledWith(
				expect.objectContaining({
					page: 1,
				}),
			);
			expect(shown(store)).toEqual([
				't1',
				't2',
			]);
		});
	});

	// the indicator is the tab's chat count, not what the pages have read
	describe('tab indicators', () => {
		it('counts the chats of each tab', async () => {
			const store = await listOf('t1', 't2', 't3');

			expect(store.activeCount).toBe(7);
			expect(store.snoozedCount).toBe(3);
			expect(store.unreadCount).toBe(4);
		});
	});
});
