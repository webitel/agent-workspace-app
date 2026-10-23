import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

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

const fetchThreadsMock = vi.fn();
vi.mock('../../../../api/chatSdk', () => ({
	threadsService: {
		fetchThreads: (...args: unknown[]) => fetchThreadsMock(...args),
	},
}));

import { useChatSnoozedStore } from '../chat-snoozed';

const buildChats = (...threadIds: string[]) =>
	threadIds.map((threadId, index) => ({
		id: index + 1,
		thread: {
			id: threadId,
		},
	}));

const page = (threadIds: string[], next = false) => ({
	items: threadIds.map((id) => ({
		id,
	})),
	next,
});

describe('chat-snoozed store', () => {
	beforeEach(() => {
		chatTaskList.value = [];
		fetchThreadsMock.mockReset();
		setActivePinia(createPinia());
	});

	it('holds no chat before anything says which are snoozed', () => {
		chatTaskList.value = buildChats('t1', 't2');
		const store = useChatSnoozedStore();

		expect(store.tasks).toEqual([]);
		expect(store.count).toBe(0);
	});

	it('lists the listed chats whose thread is snoozed, in task-feed order', async () => {
		chatTaskList.value = buildChats('t1', 't2', 't3');
		fetchThreadsMock.mockResolvedValue(
			page([
				't3',
				't1',
			]),
		);
		const store = useChatSnoozedStore();

		await store.load();

		expect(store.tasks.map((task) => task.thread?.id)).toEqual([
			't1',
			't3',
		]);
		expect(store.count).toBe(2);
		expect(store.isSnoozed('t1')).toBe(true);
		expect(store.isSnoozed('t2')).toBe(false);
	});

	// a snoozed thread whose task has gone is not listed anywhere (ADR-0008)
	it('shows no chat for a snoozed thread with no task', async () => {
		chatTaskList.value = buildChats('t1');
		fetchThreadsMock.mockResolvedValue(
			page([
				't9',
			]),
		);
		const store = useChatSnoozedStore();

		await store.load();

		expect(store.tasks).toEqual([]);
	});

	it('reads the snoozed thread ids page by page', async () => {
		fetchThreadsMock
			.mockResolvedValueOnce(
				page(
					[
						't1',
					],
					true,
				),
			)
			.mockResolvedValueOnce(
				page([
					't2',
				]),
			);
		const store = useChatSnoozedStore();

		await store.load();

		expect(fetchThreadsMock).toHaveBeenNthCalledWith(1, {
			tags: [
				'snoozed',
			],
			fields: [
				'id',
			],
			size: 100,
			page: 1,
		});
		expect(fetchThreadsMock).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				page: 2,
			}),
		);
		expect(store.isSnoozed('t1')).toBe(true);
		expect(store.isSnoozed('t2')).toBe(true);
	});

	// a reload after the socket was down drops what was unsnoozed meanwhile
	it('replaces what it held with what a later read says', async () => {
		fetchThreadsMock
			.mockResolvedValueOnce(
				page([
					't1',
				]),
			)
			.mockResolvedValueOnce(
				page([
					't2',
				]),
			);
		const store = useChatSnoozedStore();

		await store.load();
		await store.load();

		expect(store.isSnoozed('t1')).toBe(false);
		expect(store.isSnoozed('t2')).toBe(true);
	});

	it('keeps what it held when a read fails', async () => {
		fetchThreadsMock
			.mockResolvedValueOnce(
				page([
					't1',
				]),
			)
			.mockRejectedValueOnce(new Error('offline'));
		const store = useChatSnoozedStore();

		await store.load();
		await store.load();

		expect(store.isSnoozed('t1')).toBe(true);
	});

	describe('tag changes', () => {
		it('snoozes a thread whose tags now hold snoozed', () => {
			const store = useChatSnoozedStore();

			store.receiveTagsChanged({
				threadId: 't1',
				tags: [
					'snoozed',
				],
			});

			expect(store.isSnoozed('t1')).toBe(true);
		});

		// the backend clears it on any message the agent did not send
		it('returns a thread to Active once its tags no longer hold snoozed', async () => {
			fetchThreadsMock.mockResolvedValue(
				page([
					't1',
				]),
			);
			const store = useChatSnoozedStore();
			await store.load();

			store.receiveTagsChanged({
				threadId: 't1',
				tags: [],
			});

			expect(store.isSnoozed('t1')).toBe(false);
		});
	});
});
