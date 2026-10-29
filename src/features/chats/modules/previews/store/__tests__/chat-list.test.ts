import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

type FakeTask = {
	id: number;
	displayName?: string;
	displayNumber?: string;
	thread?: {
		id: string;
	};
};

const chatTaskList = ref<FakeTask[]>([]);
vi.mock('../../../../store/chats', () => ({
	useChatsStore: () => ({
		get chatTaskList() {
			return chatTaskList.value;
		},
	}),
}));

const syncMock = vi.fn();
vi.mock('../chat-previews', () => ({
	useChatPreviewsStore: () => ({
		sync: syncMock,
	}),
}));

const activeTasks = ref<FakeTask[]>([]);
const activeUnreadCount = ref(0);
const isFilteringUnread = ref(false);
const setOnlyUnreadMock = vi.fn((value: boolean) => {
	isFilteringUnread.value = value;
});
const toggleOnlyUnreadMock = vi.fn(() => {
	isFilteringUnread.value = !isFilteringUnread.value;
});
vi.mock('../chat-active', () => ({
	useChatActiveStore: () => ({
		get tasks() {
			return activeTasks.value;
		},
		get count() {
			return activeTasks.value.length;
		},
		get unreadCount() {
			return activeUnreadCount.value;
		},
		get isFilteringUnread() {
			return isFilteringUnread.value;
		},
		setOnlyUnread: setOnlyUnreadMock,
		toggleOnlyUnread: toggleOnlyUnreadMock,
	}),
}));

const snoozedTasks = ref<FakeTask[]>([]);
vi.mock('../chat-snoozed', () => ({
	useChatSnoozedStore: () => ({
		get tasks() {
			return snoozedTasks.value;
		},
		get count() {
			return snoozedTasks.value.length;
		},
	}),
}));

import { ChatListTab } from '../../enums/ChatListTab.enum';
import { CHAT_LIST_PAGE_SIZE, useChatListStore } from '../chat-list';

const buildChats = (count: number, firstId = 1): FakeTask[] =>
	Array.from(
		{
			length: count,
		},
		(_, index) => ({
			id: firstId + index,
			displayName: `Client ${firstId + index}`,
			thread: {
				id: `t${firstId + index}`,
			},
		}),
	);

const idsOf = (tasks: FakeTask[]) => tasks.map((task) => task.id);

describe('chat-list store', () => {
	beforeEach(() => {
		syncMock.mockReset();
		setOnlyUnreadMock.mockClear();
		toggleOnlyUnreadMock.mockClear();
		chatTaskList.value = [];
		snoozedTasks.value = [];
		activeTasks.value = [];
		activeUnreadCount.value = 0;
		isFilteringUnread.value = false;
		setActivePinia(createPinia());
	});

	// the store's watchers read module state shared with every later test
	afterEach(() => {
		useChatListStore().$dispose();
	});

	describe('chat previews', () => {
		it('tells the previews every chat the agent has, and the ones shown', () => {
			chatTaskList.value = buildChats(3);
			activeTasks.value = buildChats(3);

			useChatListStore();

			expect(syncMock).toHaveBeenLastCalledWith(
				[
					't1',
					't2',
					't3',
				],
				[
					't1',
					't2',
					't3',
				],
			);
		});

		// the window bounds the history reads: one request per shown chat
		it('asks for the last message of the shown window only', () => {
			chatTaskList.value = buildChats(CHAT_LIST_PAGE_SIZE + 5);
			activeTasks.value = buildChats(CHAT_LIST_PAGE_SIZE + 5);

			useChatListStore();

			const [listed, shown] = syncMock.mock.lastCall as [
				string[],
				string[],
			];
			expect(listed).toHaveLength(CHAT_LIST_PAGE_SIZE + 5);
			expect(shown).toHaveLength(CHAT_LIST_PAGE_SIZE);
		});

		// hiding a chat must not make the previews forget it
		it('still lists a chat that the search hides', async () => {
			chatTaskList.value = buildChats(3);
			activeTasks.value = buildChats(3);
			const store = useChatListStore();

			store.setQuery('Client 2');
			await nextTick();

			const [listed, shown] = syncMock.mock.lastCall as [
				string[],
				string[],
			];
			expect(listed).toEqual([
				't1',
				't2',
				't3',
			]);
			expect(shown).toEqual([
				't2',
			]);
		});

		it('follows the list as chats join and leave', async () => {
			useChatListStore();

			chatTaskList.value = buildChats(1);
			activeTasks.value = buildChats(1);
			await nextTick();
			expect(syncMock).toHaveBeenLastCalledWith(
				[
					't1',
				],
				[
					't1',
				],
			);

			chatTaskList.value = [];
			activeTasks.value = [];
			await nextTick();
			expect(syncMock).toHaveBeenLastCalledWith([], []);
		});

		// a task with no thread has no history to read
		it('leaves out a chat without a thread', () => {
			chatTaskList.value = [
				{
					id: 1,
				},
				...buildChats(1, 2),
			];
			activeTasks.value = chatTaskList.value;

			useChatListStore();

			expect(syncMock).toHaveBeenLastCalledWith(
				[
					't2',
				],
				[
					't2',
				],
			);
		});
	});

	describe('tabs', () => {
		it('opens on the Active tab', () => {
			expect(useChatListStore().currentTab).toBe(ChatListTab.Active);
		});

		it('shows the active chats on the Active tab', () => {
			activeTasks.value = buildChats(2);
			snoozedTasks.value = buildChats(1, 9);
			const store = useChatListStore();

			expect(idsOf(store.currentTasks)).toEqual([
				1,
				2,
			]);
		});

		it('shows the snoozed chats on the Snoozed tab', () => {
			activeTasks.value = buildChats(1);
			snoozedTasks.value = buildChats(1, 9);
			const store = useChatListStore();

			store.setTab(ChatListTab.Snoozed);

			expect(idsOf(store.currentTasks)).toEqual([
				9,
			]);
		});
	});

	// the task feed arrives whole, so this is a window over it (AC_02.01.02)
	describe('window', () => {
		it('shows the first page of the chats', () => {
			activeTasks.value = buildChats(CHAT_LIST_PAGE_SIZE + 5);
			const store = useChatListStore();

			expect(store.currentTasks).toHaveLength(CHAT_LIST_PAGE_SIZE);
			expect(store.currentTasks[0]?.id).toBe(1);
			expect(store.hasMore).toBe(true);
		});

		it('shows everything and offers no more when the chats fit one page', () => {
			activeTasks.value = buildChats(3);
			const store = useChatListStore();

			expect(store.currentTasks).toHaveLength(3);
			expect(store.hasMore).toBe(false);
		});

		it('grows by a page on loadMore, up to the end of the list', () => {
			activeTasks.value = buildChats(CHAT_LIST_PAGE_SIZE + 5);
			const store = useChatListStore();

			store.loadMore();

			expect(store.currentTasks).toHaveLength(CHAT_LIST_PAGE_SIZE + 5);
			expect(store.hasMore).toBe(false);
		});

		it('does not run ahead of a list that has nothing more', () => {
			activeTasks.value = buildChats(3);
			const store = useChatListStore();

			store.loadMore();
			activeTasks.value = buildChats(CHAT_LIST_PAGE_SIZE + 1);

			expect(store.currentTasks).toHaveLength(CHAT_LIST_PAGE_SIZE);
		});

		it('starts a new tab from the first page', async () => {
			activeTasks.value = buildChats(CHAT_LIST_PAGE_SIZE * 2);
			snoozedTasks.value = buildChats(CHAT_LIST_PAGE_SIZE * 2, 100);
			const store = useChatListStore();
			store.loadMore();
			expect(store.currentTasks).toHaveLength(CHAT_LIST_PAGE_SIZE * 2);

			store.setTab(ChatListTab.Snoozed);
			await nextTick();

			expect(store.currentTasks).toHaveLength(CHAT_LIST_PAGE_SIZE);
		});

		it('starts the filtered list from the first page', async () => {
			activeTasks.value = buildChats(CHAT_LIST_PAGE_SIZE * 2);
			const store = useChatListStore();
			store.loadMore();

			store.toggleOnlyUnread();
			await nextTick();

			expect(store.currentTasks).toHaveLength(CHAT_LIST_PAGE_SIZE);
		});
	});

	describe('search', () => {
		beforeEach(() => {
			activeTasks.value = [
				{
					id: 1,
					displayName: 'Jane Doe',
					displayNumber: '@jane',
				},
				{
					id: 2,
					displayName: 'John Smith',
					displayNumber: '@john',
				},
			];
			snoozedTasks.value = [
				{
					id: 9,
					displayName: 'Janet Smith',
				},
			];
		});

		it('narrows the tab to the chats whose client matches', () => {
			const store = useChatListStore();

			store.setQuery('jane');

			expect(idsOf(store.currentTasks)).toEqual([
				1,
			]);
		});

		it('trims what was typed', () => {
			const store = useChatListStore();

			store.setQuery('  john ');

			expect(store.query).toBe('john');
			expect(idsOf(store.currentTasks)).toEqual([
				2,
			]);
		});

		it('searches the Snoozed tab too', () => {
			const store = useChatListStore();
			store.setTab(ChatListTab.Snoozed);

			store.setQuery('janet');

			expect(idsOf(store.currentTasks)).toEqual([
				9,
			]);
		});

		it('lists the whole tab again once the search is cleared', () => {
			const store = useChatListStore();
			store.setQuery('jane');

			store.setQuery('');

			expect(idsOf(store.currentTasks)).toEqual([
				1,
				2,
			]);
		});

		// the indicator is the tab's chat count, not what the search leaves of it
		it('does not change the tab indicators', () => {
			const store = useChatListStore();

			store.setQuery('jane');

			expect(store.activeCount).toBe(2);
			expect(store.snoozedCount).toBe(1);
		});
	});

	describe('unread filter', () => {
		it('switches the filter on the Active tab', () => {
			const store = useChatListStore();

			store.toggleOnlyUnread();

			expect(toggleOnlyUnreadMock).toHaveBeenCalledOnce();
			expect(store.currentTab).toBe(ChatListTab.Active);
		});

		// AC_02.02.04
		it('hands the agent over to the Active tab with the filter on, from Snoozed', () => {
			const store = useChatListStore();
			store.setTab(ChatListTab.Snoozed);

			store.toggleOnlyUnread();

			expect(store.currentTab).toBe(ChatListTab.Active);
			expect(setOnlyUnreadMock).toHaveBeenCalledWith(true);
			expect(toggleOnlyUnreadMock).not.toHaveBeenCalled();
		});
	});

	describe('tab indicators', () => {
		it('counts the chats of each tab', () => {
			activeTasks.value = buildChats(3);
			snoozedTasks.value = buildChats(2, 9);
			const store = useChatListStore();

			expect(store.activeCount).toBe(3);
			expect(store.snoozedCount).toBe(2);
		});

		it('carries the unread count of the Active tab', () => {
			activeUnreadCount.value = 4;
			const store = useChatListStore();

			expect(store.unreadCount).toBe(4);
		});
	});
});
