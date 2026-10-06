import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

import { CHAT_LIST_PAGE_SIZE, useChatListStore } from '../chat-list';

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

const threadIdsOf = (from: number, to: number) =>
	Array.from(
		{
			length: to - from + 1,
		},
		(_, index) => `t${from + index}`,
	);

describe('chat-list store', () => {
	beforeEach(() => {
		syncMock.mockReset();
		chatTaskList.value = [];
		unreadByThread.value = {};
		setActivePinia(createPinia());
	});

	describe('window', () => {
		it('shows the first page of the chats', () => {
			chatTaskList.value = buildChats(CHAT_LIST_PAGE_SIZE + 5);
			const store = useChatListStore();

			expect(store.visibleTasks).toHaveLength(CHAT_LIST_PAGE_SIZE);
			expect(store.visibleTasks[0]?.id).toBe(1);
			expect(store.hasMore).toBe(true);
		});

		it('shows everything and offers no more when the chats fit one page', () => {
			chatTaskList.value = buildChats(3);
			const store = useChatListStore();

			expect(store.visibleTasks).toHaveLength(3);
			expect(store.hasMore).toBe(false);
		});

		it('grows by a page on loadMore, up to the end of the list', () => {
			chatTaskList.value = buildChats(CHAT_LIST_PAGE_SIZE + 5);
			const store = useChatListStore();

			store.loadMore();

			expect(store.visibleTasks).toHaveLength(CHAT_LIST_PAGE_SIZE + 5);
			expect(store.hasMore).toBe(false);
		});

		it('does not grow past the end of the list', () => {
			chatTaskList.value = buildChats(3);
			const store = useChatListStore();

			store.loadMore();
			chatTaskList.value = buildChats(CHAT_LIST_PAGE_SIZE + 1);

			// the window did not run ahead of the list while there was nothing more
			expect(store.visibleTasks).toHaveLength(CHAT_LIST_PAGE_SIZE);
		});
	});

	describe('chat previews', () => {
		it('gives the previews only the thread ids inside the window', () => {
			chatTaskList.value = buildChats(CHAT_LIST_PAGE_SIZE + 5);

			useChatListStore();

			expect(syncMock).toHaveBeenLastCalledWith(
				threadIdsOf(1, CHAT_LIST_PAGE_SIZE),
			);
		});

		it('adds the chats of the next page once they scroll in', async () => {
			chatTaskList.value = buildChats(CHAT_LIST_PAGE_SIZE + 5);
			const store = useChatListStore();

			store.loadMore();
			await nextTick();

			expect(syncMock).toHaveBeenLastCalledWith(
				threadIdsOf(1, CHAT_LIST_PAGE_SIZE + 5),
			);
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
			expect(store.visibleTasks).toHaveLength(3);
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
			expect(store.visibleTasks.map((task) => task.id)).toEqual([
				2,
				4,
			]);
			expect(syncMock).toHaveBeenLastCalledWith([
				't2',
				't4',
			]);
		});

		it('lists every chat again once switched off', () => {
			chatTaskList.value = buildChats(4);
			unreadByThread.value = {
				t2: 1,
			};
			const store = useChatListStore();

			store.toggleOnlyUnread();
			store.toggleOnlyUnread();

			expect(store.visibleTasks).toHaveLength(4);
		});

		it('starts the filtered list from the first page', () => {
			chatTaskList.value = buildChats(CHAT_LIST_PAGE_SIZE * 2 + 5);
			unreadByThread.value = Object.fromEntries(
				chatTaskList.value.map((task) => [
					task.thread?.id,
					1,
				]),
			);
			const store = useChatListStore();
			store.loadMore();
			expect(store.visibleTasks).toHaveLength(CHAT_LIST_PAGE_SIZE * 2);

			store.toggleOnlyUnread();

			expect(store.visibleTasks).toHaveLength(CHAT_LIST_PAGE_SIZE);
		});
	});
});
