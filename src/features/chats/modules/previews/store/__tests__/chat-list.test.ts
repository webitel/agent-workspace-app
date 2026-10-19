import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

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
vi.mock('../chat-previews', () => ({
	useChatPreviewsStore: () => ({
		sync: syncMock,
	}),
}));

const activeTasks = ref<
	{
		id: number;
	}[]
>([]);
const activeUnreadCount = ref(0);
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
		snoozedTasks.value = [];
		activeTasks.value = [];
		activeUnreadCount.value = 0;
		setActivePinia(createPinia());
	});

	// the store's watcher reads the shared task list, so a store left running
	// would keep calling the shared sync mock from every later test
	afterEach(() => {
		useChatListStore().$dispose();
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

	describe('tabs', () => {
		it('opens on the Active tab', () => {
			const store = useChatListStore();

			expect(store.currentTab).toBe(ChatListTab.Active);
		});

		it('shows the active chats on the Active tab', () => {
			activeTasks.value = [
				{
					id: 1,
				},
				{
					id: 2,
				},
			];
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
			activeTasks.value = [
				{
					id: 1,
				},
			];
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
	});

	describe('tab indicators', () => {
		it('counts the chats of each tab', () => {
			activeTasks.value = [
				{
					id: 1,
				},
				{
					id: 2,
				},
				{
					id: 3,
				},
			];
			snoozedTasks.value = [
				{
					id: 9,
				},
				{
					id: 10,
				},
			];
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
