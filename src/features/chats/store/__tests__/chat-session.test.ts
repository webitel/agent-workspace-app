import { createTestingPinia } from '@pinia/testing';
import { getActivePinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchThreadMock = vi.fn();
const fetchMessageHistoryMock = vi.fn();
const sendMessageMock = vi.fn();

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
		sendMessage: sendMessageMock,
	}) as never;

// A File whose `type` drives images-vs-documents classification in sendFiles.
const file = (name: string, mime: string) =>
	({
		name,
		type: mime,
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
		setActivePinia(
			createTestingPinia({
				stubActions: false,
				createSpy: vi.fn,
			}),
		);
		fetchThreadMock.mockReset();
		fetchMessageHistoryMock.mockReset();
		sendMessageMock.mockReset();
		fetchThreadMock.mockResolvedValue(thread());
	});

	describe('load', () => {
		it('fetches thread then first history page and stores it oldest->newest', async () => {
			// API returns newest->oldest (DESC); the store reverses it to ASC.
			fetchMessageHistoryMock.mockResolvedValue(
				historyPage(
					[
						'm2',
						'm1',
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
		it('pages older messages via keyset cursor, reverses to ASC and prepends the block', async () => {
			// Both pages arrive newest->oldest (DESC). First page: m4 (newest), m3.
			fetchMessageHistoryMock.mockResolvedValueOnce(
				historyPage(
					[
						'm4',
						'm3',
					],
					'cursor-older',
				),
			);
			const store = useChatSessionStore('chat-1');
			await store.load();

			// Older page: m2 (newer), m1 (oldest) — both older than the loaded block.
			fetchMessageHistoryMock.mockResolvedValueOnce(
				historyPage(
					[
						'm2',
						'm1',
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

	describe('receiveMessage', () => {
		// message carrying a threadId + optional marker field to prove replacement
		const threadMessage = (id: string, threadId: string, body?: string) =>
			({
				id,
				threadId,
				body,
			}) as never;

		const loadedChat1 = async () => {
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
			return store;
		};

		it('appends a new live message to the tail', async () => {
			const store = await loadedChat1();

			store.receiveMessage(threadMessage('m2', 'chat-1'));

			expect(store.messages.map((message) => message.id)).toEqual([
				'm1',
				'm2',
			]);
		});

		it('replaces an existing message by id in place (edit / own echo)', async () => {
			const store = await loadedChat1();
			store.receiveMessage(threadMessage('m2', 'chat-1', 'original'));

			store.receiveMessage(threadMessage('m2', 'chat-1', 'edited'));

			expect(store.messages.map((message) => message.id)).toEqual([
				'm1',
				'm2',
			]);
			const replaced = store.messages.find((message) => message.id === 'm2');
			expect(
				(
					replaced as {
						body?: string;
					}
				).body,
			).toBe('edited');
		});

		it('ignores a message whose threadId is a different chat', async () => {
			const store = await loadedChat1();

			store.receiveMessage(threadMessage('other', 'chat-2'));

			expect(store.messages.map((message) => message.id)).toEqual([
				'm1',
			]);
		});
	});

	const loadedStore = async () => {
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
		return store;
	};

	describe('sendText', () => {
		it('sends the trimmed body through the thread', async () => {
			const store = await loadedStore();

			await store.sendText('  hello  ');

			expect(sendMessageMock).toHaveBeenCalledWith({
				body: 'hello',
			});
		});

		it('does nothing for blank text', async () => {
			const store = await loadedStore();

			await store.sendText('   ');

			expect(sendMessageMock).not.toHaveBeenCalled();
		});

		it('does nothing before a thread is loaded', async () => {
			const store = useChatSessionStore('chat-1');

			await store.sendText('hello');

			expect(sendMessageMock).not.toHaveBeenCalled();
		});
	});

	describe('sendFiles', () => {
		it('classifies an all-image batch as images', async () => {
			const store = await loadedStore();
			const files = [
				file('a.png', 'image/png'),
				file('b.jpg', 'image/jpeg'),
			];

			await store.sendFiles(files, 'caption');

			expect(sendMessageMock).toHaveBeenCalledWith({
				body: 'caption',
				attachments: {
					type: 'images',
					files,
				},
			});
		});

		it('classifies a mixed batch as documents', async () => {
			const store = await loadedStore();
			const files = [
				file('a.png', 'image/png'),
				file('b.pdf', 'application/pdf'),
			];

			await store.sendFiles(files);

			expect(sendMessageMock).toHaveBeenCalledWith({
				body: undefined,
				attachments: {
					type: 'documents',
					files,
				},
			});
		});

		it('does nothing for an empty file list', async () => {
			const store = await loadedStore();

			await store.sendFiles([]);

			expect(sendMessageMock).not.toHaveBeenCalled();
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

		it('gives a fresh uninitialized store when a chat is reopened', async () => {
			fetchMessageHistoryMock.mockResolvedValue(
				historyPage(
					[
						'm1',
					],
					null,
				),
			);
			const first = useChatSessionStore('chat-1');
			await first.load();
			expect(first.initialized).toBe(true);

			disposeChatSession('chat-1');
			const reopened = useChatSessionStore('chat-1');

			expect(reopened.initialized).toBe(false);
			expect(reopened.messages).toEqual([]);
		});
	});
});
