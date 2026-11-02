import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const findLeftThreadMock = vi.fn();

vi.mock('../../../../api/chatSdk', () => ({
	threadsService: {
		findLeftThread: (...args: unknown[]) => findLeftThreadMock(...args),
	},
	messagesService: {},
}));

import type {
	ILeftThread,
	IMessage,
} from '../../../../types/ChatSession.types';
import {
	disposeClosedChat,
	seedClosedChat,
	useClosedChatStore,
} from '../closed-chat';

const message = (id: string) =>
	({
		id,
	}) as unknown as IMessage;

const createLeftThread = (
	fetchMessageHistory = vi.fn().mockResolvedValue({
		items: [],
	}),
) =>
	({
		id: 't-1',
		fetchMessageHistory,
	}) as unknown as ILeftThread;

describe('closed-chat store', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
				createSpy: vi.fn,
			}),
		);
		findLeftThreadMock.mockReset();
		disposeClosedChat('t-1');
		disposeClosedChat('t-2');
	});

	describe('load', () => {
		it('reads history from the seed without looking the thread up', async () => {
			const fetchMessageHistory = vi.fn().mockResolvedValue({
				items: [],
			});
			const seed = createLeftThread(fetchMessageHistory);
			const store = useClosedChatStore('t-1');

			await store.load(seed);

			expect(findLeftThreadMock).not.toHaveBeenCalled();
			expect(fetchMessageHistory).toHaveBeenCalledWith({
				size: 30,
			});
			expect(store.thread).toStrictEqual(seed);
		});

		it('reads from a thread seeded beforehand when load gets none', async () => {
			const seed = createLeftThread();
			seedClosedChat(seed);
			const store = useClosedChatStore('t-1');

			await store.load();

			expect(findLeftThreadMock).not.toHaveBeenCalled();
			expect(seed.fetchMessageHistory).toHaveBeenCalledTimes(1);
			expect(store.thread).toStrictEqual(seed);
		});

		it('looks the thread up by id when there is no seed', async () => {
			const leftThread = createLeftThread();
			findLeftThreadMock.mockResolvedValue(leftThread);
			const store = useClosedChatStore('t-1');

			await store.load();

			expect(findLeftThreadMock).toHaveBeenCalledWith('t-1');
			expect(leftThread.fetchMessageHistory).toHaveBeenCalledTimes(1);
			expect(store.isNotFound).toBe(false);
		});

		it('is not found, and reads no history, when the thread is not left', async () => {
			findLeftThreadMock.mockResolvedValue(null);
			const store = useClosedChatStore('t-1');

			await store.load();

			expect(store.isNotFound).toBe(true);
			expect(store.thread).toBeNull();
			expect(store.isLoading).toBe(false);
		});

		it('does nothing once loaded', async () => {
			const seed = createLeftThread();
			const store = useClosedChatStore('t-1');
			await store.load(seed);

			await store.load(seed);
			await store.load();

			expect(findLeftThreadMock).not.toHaveBeenCalled();
			expect(seed.fetchMessageHistory).toHaveBeenCalledTimes(1);
		});

		it('keeps the error, and can load again, when the read fails', async () => {
			const failure = new Error('network down');
			findLeftThreadMock.mockRejectedValueOnce(failure);
			const store = useClosedChatStore('t-1');
			await store.load();
			expect(store.error).toBe(failure);

			findLeftThreadMock.mockResolvedValueOnce(createLeftThread());
			await store.load();

			expect(store.error).toBeNull();
			expect(store.thread).not.toBeNull();
		});

		it('lets a late answer for a superseded load write nothing', async () => {
			let resolveFirst: (value: ILeftThread) => void = () => {};
			findLeftThreadMock.mockReturnValueOnce(
				new Promise<ILeftThread>((resolve) => {
					resolveFirst = resolve;
				}),
			);
			const staleThread = createLeftThread(
				vi.fn().mockResolvedValue({
					items: [
						message('stale'),
					],
				}),
			);
			const store = useClosedChatStore('t-1');
			const first = store.load();
			const seedThread = createLeftThread(
				vi.fn().mockResolvedValue({
					items: [
						message('fresh'),
					],
				}),
			);

			await store.load(seedThread);
			resolveFirst(staleThread);
			await first;

			expect(store.thread).toStrictEqual(seedThread);
			expect(store.messages.map(({ id }) => id)).toEqual([
				'fresh',
			]);
		});
	});

	describe('messages', () => {
		it('puts the oldest message first, as the chat session does', async () => {
			// the API answers newest first
			const seed = createLeftThread(
				vi.fn().mockResolvedValue({
					items: [
						message('3'),
						message('2'),
						message('1'),
					],
				}),
			);
			const store = useClosedChatStore('t-1');

			await store.load(seed);

			expect(store.messages.map(({ id }) => id)).toEqual([
				'1',
				'2',
				'3',
			]);
		});

		it('has more while the page carries a next cursor', async () => {
			const store = useClosedChatStore('t-1');

			await store.load(
				createLeftThread(
					vi.fn().mockResolvedValue({
						items: [
							message('2'),
						],
						nextCursor: {
							id: 'cursor-1',
						},
					}),
				),
			);
			expect(store.hasMore).toBe(true);

			const lastPageStore = useClosedChatStore('t-2');
			await lastPageStore.load(
				createLeftThread(
					vi.fn().mockResolvedValue({
						items: [
							message('1'),
						],
					}),
				),
			);
			expect(lastPageStore.hasMore).toBe(false);
		});
	});

	describe('loadMore', () => {
		it('reads from the last next cursor and prepends the older messages', async () => {
			const fetchMessageHistory = vi
				.fn()
				.mockResolvedValueOnce({
					items: [
						message('4'),
						message('3'),
					],
					nextCursor: {
						id: 'cursor-1',
					},
				})
				.mockResolvedValueOnce({
					items: [
						message('2'),
						message('1'),
					],
				});
			const store = useClosedChatStore('t-1');
			await store.load(createLeftThread(fetchMessageHistory));

			await store.loadMore();

			expect(fetchMessageHistory).toHaveBeenLastCalledWith({
				size: 30,
				cursorId: 'cursor-1',
				cursorBefore: false,
			});
			expect(store.messages.map(({ id }) => id)).toEqual([
				'1',
				'2',
				'3',
				'4',
			]);
			expect(store.hasMore).toBe(false);
		});

		it('reads nothing once the oldest page is in', async () => {
			const seed = createLeftThread();
			const store = useClosedChatStore('t-1');
			await store.load(seed);

			await store.loadMore();

			expect(seed.fetchMessageHistory).toHaveBeenCalledTimes(1);
		});
	});

	describe('isolation', () => {
		it('keeps the stores of different threads apart', async () => {
			const first = useClosedChatStore('t-1');
			const second = useClosedChatStore('t-2');

			await first.load(
				createLeftThread(
					vi.fn().mockResolvedValue({
						items: [
							message('a'),
						],
					}),
				),
			);

			expect(first.messages).toHaveLength(1);
			expect(second.messages).toHaveLength(0);
			expect(second.thread).toBeNull();
		});

		it('gives a disposed thread a fresh store', async () => {
			const store = useClosedChatStore('t-1');
			await store.load(createLeftThread());

			disposeClosedChat('t-1');

			expect(useClosedChatStore('t-1').thread).toBeNull();
		});
	});
});
