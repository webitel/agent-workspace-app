import { createPinia, getActivePinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchThreadMock = vi.fn();
const fetchMessageHistoryMock = vi.fn();

vi.mock('../../api/chatSdk', () => ({
	threadsService: {
		fetchThread: (...args: unknown[]) => fetchThreadMock(...args),
	},
	messagesService: {},
}));

import { disposeChatSession, useChatSessionStore } from '../chat-session';

// minimal SDK-shaped fakes
const message = (id: string) =>
	({
		id,
	}) as never;
const thread = () =>
	({
		fetchMessageHistory: fetchMessageHistoryMock,
	}) as never;

const historyPage = (ids: string[], nextCursorId: string | null) => ({
	items: ids.map(message),
	nextCursor: nextCursorId
		? {
				id: nextCursorId,
			}
		: undefined,
});

describe('chat-session store', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		fetchThreadMock.mockReset();
		fetchMessageHistoryMock.mockReset();
		fetchThreadMock.mockResolvedValue(thread());
	});

	describe('load', () => {
		it('fetches thread then first history page and exposes state', async () => {
			fetchMessageHistoryMock.mockResolvedValue(
				historyPage(
					[
						'm1',
						'm2',
					],
					'cursor-older',
				),
			);
			const store = useChatSessionStore('chat-1');

			await store.load();

			expect(fetchThreadMock).toHaveBeenCalledWith('chat-1');
			expect(fetchMessageHistoryMock).toHaveBeenCalledWith({
				size: 30,
			});
			expect(store.messages.map((message) => message.id)).toEqual([
				'm1',
				'm2',
			]);
			expect(store.olderCursor).toBe('cursor-older');
			expect(store.hasMore).toBe(true);
			expect(store.initialized).toBe(true);
			expect(store.isLoading).toBe(false);
		});

		it('reports no more history when response has no nextCursor', async () => {
			fetchMessageHistoryMock.mockResolvedValue(
				historyPage(
					[
						'm1',
					],
					null,
				),
			);
			const store = useChatSessionStore('chat-1');

			await store.load();

			expect(store.olderCursor).toBeNull();
			expect(store.hasMore).toBe(false);
		});

		it('is idempotent across repeated calls', async () => {
			fetchMessageHistoryMock.mockResolvedValue(
				historyPage(
					[
						'm1',
					],
					null,
				),
			);
			const store = useChatSessionStore('chat-1');

			await store.load();
			await store.load();

			expect(fetchThreadMock).toHaveBeenCalledOnce();
		});

		it('captures error and stays uninitialized on failure', async () => {
			const failure = new Error('boom');
			fetchThreadMock.mockRejectedValue(failure);
			const store = useChatSessionStore('chat-1');

			await store.load();

			expect(store.error).toBe(failure);
			expect(store.initialized).toBe(false);
			expect(store.isLoading).toBe(false);
		});
	});

	describe('loadMore', () => {
		it('pages older messages via keyset cursor and prepends them', async () => {
			fetchMessageHistoryMock.mockResolvedValueOnce(
				historyPage(
					[
						'm3',
						'm4',
					],
					'cursor-older',
				),
			);
			const store = useChatSessionStore('chat-1');
			await store.load();

			fetchMessageHistoryMock.mockResolvedValueOnce(
				historyPage(
					[
						'm1',
						'm2',
					],
					null,
				),
			);
			await store.loadMore();

			expect(fetchMessageHistoryMock).toHaveBeenLastCalledWith({
				size: 30,
				cursorId: 'cursor-older',
				cursorBefore: false,
			});
			expect(store.messages.map((message) => message.id)).toEqual([
				'm1',
				'm2',
				'm3',
				'm4',
			]);
			expect(store.hasMore).toBe(false);
		});

		it('does nothing when there is no older cursor', async () => {
			fetchMessageHistoryMock.mockResolvedValue(
				historyPage(
					[
						'm1',
					],
					null,
				),
			);
			const store = useChatSessionStore('chat-1');
			await store.load();
			fetchMessageHistoryMock.mockClear();

			await store.loadMore();

			expect(fetchMessageHistoryMock).not.toHaveBeenCalled();
		});
	});

	describe('appendMessage', () => {
		it('appends an incoming message to the tail', async () => {
			fetchMessageHistoryMock.mockResolvedValue(
				historyPage(
					[
						'm1',
					],
					null,
				),
			);
			const store = useChatSessionStore('chat-1');
			await store.load();

			store.appendMessage(message('m2'));

			expect(store.messages.map((message) => message.id)).toEqual([
				'm1',
				'm2',
			]);
		});
	});

	describe('disposeChatSession', () => {
		it('disposes the store and clears its pinia state entry', async () => {
			fetchMessageHistoryMock.mockResolvedValue(
				historyPage(
					[
						'm1',
					],
					null,
				),
			);
			const store = useChatSessionStore('chat-1');
			await store.load();
			expect(getActivePinia()?.state.value['chat:chat-1']).toBeDefined();

			disposeChatSession('chat-1');

			expect(getActivePinia()?.state.value['chat:chat-1']).toBeUndefined();
		});
	});
});
