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
import { useChatListStore } from '../chat-list';

// `null`, not `undefined`: passing undefined would re-apply the default
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
