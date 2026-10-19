import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref, shallowRef } from 'vue';

const chatTaskList = ref<
	{
		id: number;
		thread?: {
			id: string;
		};
	}[]
>([]);
vi.mock('../../../../store/chats', () => ({
	useChatsStore: () => ({
		get chatTaskList() {
			return chatTaskList.value;
		},
	}),
}));

const syncMock = vi.fn();
const unreadByThread = shallowRef<Record<string, number>>({});
vi.mock('../chat-previews', () => ({
	useChatPreviewsStore: () => ({
		sync: syncMock,
		get hasUnreadData() {
			return Object.keys(unreadByThread.value).length > 0;
		},
		isUnread: (threadId: string) => (unreadByThread.value[threadId] ?? 0) > 0,
	}),
}));

const snoozedTasks = ref<
	{
		id: number;
	}[]
>([]);
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
import { useChatListStore } from '../chat-list';

// `null`, not `undefined`: passing undefined would re-apply the default
const buildChats = (count: number, firstId = 1) =>
	Array.from(
		{
			length: count,
		},
		(_, index) => ({
			id: firstId + index,
			thread: {
				id: `t${firstId + index}`,
			},
		}),
	);

describe('chat-list store', () => {
	beforeEach(() => {
		syncMock.mockReset();
		chatTaskList.value = [];
		unreadByThread.value = {};
		snoozedTasks.value = [];
		setActivePinia(createPinia());
	});

	// the store's watcher reads the shared task list, so a store left running
	// would keep calling the shared sync mock from every later test
	afterEach(() => {
		useChatListStore().$dispose();
	});

	describe('chats', () => {
		it('lists every active chat', () => {
			chatTaskList.value = buildChats(45);
			const store = useChatListStore();

			expect(store.tasks).toHaveLength(45);
		});
	});

	describe('chat previews', () => {
		it('gives the previews the thread ids of every listed chat', () => {
			chatTaskList.value = buildChats(3);

			useChatListStore();

			expect(syncMock).toHaveBeenLastCalledWith([
				't1',
				't2',
				't3',
			]);
		});

		it('follows the list as chats join and leave', async () => {
			useChatListStore();

			chatTaskList.value = buildChats(1);
			await nextTick();
			expect(syncMock).toHaveBeenLastCalledWith([
				't1',
			]);

			chatTaskList.value = [];
			await nextTick();
			expect(syncMock).toHaveBeenLastCalledWith([]);
		});

		// a task with no thread has no history to read
		it('leaves out a chat without a thread', () => {
			chatTaskList.value = [
				{
					id: 1,
				},
				...buildChats(1, 2),
			];

			useChatListStore();

			expect(syncMock).toHaveBeenLastCalledWith([
				't2',
			]);
		});
	});

	describe('unread filter', () => {
		it('is unavailable while there is no unread data', () => {
			const store = useChatListStore();

			expect(store.isUnreadFilterAvailable).toBe(false);
		});

		it('does not filter on a choice made while it was unavailable', () => {
			chatTaskList.value = buildChats(3);
			const store = useChatListStore();

			store.toggleOnlyUnread();

			expect(store.isFilteringUnread).toBe(false);
			expect(store.tasks).toHaveLength(3);
		});

		it('keeps only the chats with unread messages', async () => {
			chatTaskList.value = buildChats(4);
			unreadByThread.value = {
				t2: 1,
				t3: 0,
				t4: 5,
			};
			const store = useChatListStore();

			store.toggleOnlyUnread();
			await nextTick();

			expect(store.isUnreadFilterAvailable).toBe(true);
			expect(store.tasks.map((task) => task.id)).toEqual([
				2,
				4,
			]);
		});

		// a hidden chat still has a last message to keep, and dropping it would
		// read its history again when the filter goes off
		it('keeps the previews of every chat while the filter hides some', async () => {
			chatTaskList.value = buildChats(4);
			unreadByThread.value = {
				t2: 1,
			};
			const store = useChatListStore();
			syncMock.mockClear();

			store.toggleOnlyUnread();
			await nextTick();

			expect(store.tasks).toHaveLength(1);
			expect(syncMock).not.toHaveBeenCalled();
		});

		it('lists every chat again once switched off', () => {
			chatTaskList.value = buildChats(4);
			unreadByThread.value = {
				t2: 1,
			};
			const store = useChatListStore();

			store.toggleOnlyUnread();
			store.toggleOnlyUnread();

			expect(store.tasks).toHaveLength(4);
		});
	});

	describe('tabs', () => {
		it('opens on the Active tab', () => {
			const store = useChatListStore();

			expect(store.currentTab).toBe(ChatListTab.Active);
		});

		it('shows the active chats on the Active tab', () => {
			chatTaskList.value = buildChats(2);
			snoozedTasks.value = [
				{
					id: 9,
				},
			];
			const store = useChatListStore();

			expect(store.currentTasks.map((task) => task.id)).toEqual([
				1,
				2,
			]);
		});

		it('shows the snoozed chats on the Snoozed tab', () => {
			chatTaskList.value = buildChats(2);
			snoozedTasks.value = [
				{
					id: 9,
				},
			];
			const store = useChatListStore();

			store.setTab(ChatListTab.Snoozed);

			expect(store.currentTasks.map((task) => task.id)).toEqual([
				9,
			]);
		});

		it('does not apply the unread filter to the Snoozed tab', () => {
			unreadByThread.value = {
				t1: 1,
			};
			snoozedTasks.value = [
				{
					id: 9,
				},
				{
					id: 10,
				},
			];
			const store = useChatListStore();

			store.toggleOnlyUnread();
			store.setTab(ChatListTab.Snoozed);

			expect(store.currentTasks).toHaveLength(2);
		});
	});

	describe('tab indicators', () => {
		it('counts every chat on the Active tab, whatever the unread filter shows', () => {
			chatTaskList.value = buildChats(4);
			unreadByThread.value = {
				t2: 1,
			};
			const store = useChatListStore();

			store.toggleOnlyUnread();

			expect(store.activeCount).toBe(4);
		});

		it('counts the snoozed chats on the Snoozed tab', () => {
			snoozedTasks.value = [
				{
					id: 9,
				},
				{
					id: 10,
				},
			];
			const store = useChatListStore();

			expect(store.snoozedCount).toBe(2);
		});

		// the backend sends no unread data yet, and a count worked out on the client
		// would read as fact (ADR-0001)
		it('has no unread count while there is no unread data', () => {
			chatTaskList.value = buildChats(3);
			const store = useChatListStore();

			expect(store.unreadCount).toBe(0);
		});

		it('counts the listed chats with unread messages', () => {
			chatTaskList.value = buildChats(4);
			unreadByThread.value = {
				t2: 1,
				t3: 0,
				t4: 7,
				// a chat that has left the list does not count
				t99: 3,
			};
			const store = useChatListStore();

			expect(store.unreadCount).toBe(2);
		});
	});
});
