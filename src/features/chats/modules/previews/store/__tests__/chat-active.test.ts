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

const unreadByThread = shallowRef<Record<string, number>>({});
vi.mock('../chat-previews', () => ({
	useChatPreviewsStore: () => ({
		get hasUnreadData() {
			return Object.keys(unreadByThread.value).length > 0;
		},
		isUnread: (threadId: string) => (unreadByThread.value[threadId] ?? 0) > 0,
	}),
}));

const snoozedThreadIds = ref(new Set<string>());
vi.mock('../chat-snoozed', () => ({
	useChatSnoozedStore: () => ({
		isSnoozed: (threadId: string) => snoozedThreadIds.value.has(threadId),
	}),
}));

import { useChatActiveStore } from '../chat-active';

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

describe('chat-active store', () => {
	beforeEach(() => {
		chatTaskList.value = [];
		unreadByThread.value = {};
		snoozedThreadIds.value = new Set();
		setActivePinia(createPinia());
	});

	// which chats the tab shows is read page by page in chat-list (ADR-0013)
	describe('chats', () => {
		it('counts every active chat, not a page of them', () => {
			chatTaskList.value = buildChats(45);
			const store = useChatActiveStore();

			expect(store.count).toBe(45);
		});

		it('counts every chat, whatever the unread filter shows', () => {
			chatTaskList.value = buildChats(4);
			unreadByThread.value = {
				t2: 1,
			};
			const store = useChatActiveStore();

			store.toggleOnlyUnread();

			expect(store.count).toBe(4);
		});
	});

	// a chat is on exactly one tab (AC_02.01.01)
	describe('snoozed chats', () => {
		it('leaves snoozed chats to the Snoozed tab', () => {
			chatTaskList.value = buildChats(3);
			snoozedThreadIds.value = new Set([
				't2',
			]);
			const store = useChatActiveStore();

			expect(store.count).toBe(2);
		});

		it('does not count a snoozed chat as unread on Active', () => {
			chatTaskList.value = buildChats(3);
			unreadByThread.value = {
				t2: 1,
				t3: 1,
			};
			snoozedThreadIds.value = new Set([
				't2',
			]);
			const store = useChatActiveStore();

			expect(store.unreadCount).toBe(1);
		});
	});

	describe('unread filter', () => {
		it('is unavailable while there is no unread data', () => {
			const store = useChatActiveStore();

			expect(store.isUnreadFilterAvailable).toBe(false);
		});

		it('does not filter on a choice made while it was unavailable', () => {
			chatTaskList.value = buildChats(3);
			const store = useChatActiveStore();

			store.toggleOnlyUnread();

			expect(store.isFilteringUnread).toBe(false);
		});

		it('filters once there is unread data behind it', async () => {
			chatTaskList.value = buildChats(4);
			unreadByThread.value = {
				t2: 1,
			};
			const store = useChatActiveStore();

			store.toggleOnlyUnread();
			await nextTick();

			expect(store.isUnreadFilterAvailable).toBe(true);
			expect(store.isFilteringUnread).toBe(true);
		});

		it('stops filtering once switched off', () => {
			chatTaskList.value = buildChats(4);
			unreadByThread.value = {
				t2: 1,
			};
			const store = useChatActiveStore();

			store.toggleOnlyUnread();
			store.toggleOnlyUnread();

			expect(store.isFilteringUnread).toBe(false);
		});

		it('is set on, not switched, when handed over from Snoozed', () => {
			unreadByThread.value = {
				t2: 1,
			};
			const store = useChatActiveStore();

			store.setOnlyUnread(true);
			store.setOnlyUnread(true);

			expect(store.isFilteringUnread).toBe(true);
		});
	});

	describe('unread count', () => {
		// the backend sends no unread data yet, and a count worked out on the client
		// would read as fact (ADR-0001)
		it('is zero while there is no unread data', () => {
			chatTaskList.value = buildChats(3);
			const store = useChatActiveStore();

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
			const store = useChatActiveStore();

			expect(store.unreadCount).toBe(2);
		});
	});
});
