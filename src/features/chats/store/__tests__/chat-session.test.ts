import { createTestingPinia } from '@pinia/testing';
import { flushPromises } from '@vue/test-utils';
import { getActivePinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchThreadMock = vi.fn();
const fetchMessageHistoryMock = vi.fn();
const sendMessageMock = vi.fn();

vi.mock('../../api/chatSdk', () => ({
	accountService: {
		// every test gets this answer when it loads the chat-account store
		getAccount: vi.fn().mockResolvedValue({
			contact: {
				sub: '42',
				iss: 'webitel',
			},
		}),
	},
	threadsService: {
		fetchThread: (...args: unknown[]) => fetchThreadMock(...args),
	},
	messagesService: {},
}));

import { useChatAccountStore } from '../chat-account';
import {
	chatSessionIds,
	disposeChatSession,
	hasChatSession,
	retainChatSessions,
	useChatSessionStore,
} from '../chat-session';
import { useChatVariablesStore } from '../chat-variables';

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

// a message with a send time, for cases where order by time matters
const timedMessage = (id: string, at: number, body?: string) =>
	({
		id,
		threadId: 'chat-1',
		createdAt: String(at),
		body,
	}) as never;

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

		it('resolves the operator’s own member from the logged-in account', async () => {
			fetchThreadMock.mockResolvedValue({
				...(thread() as object),
				members: [
					{
						id: 'm-client',
						contact: {
							sub: 'client-1',
							iss: 'telegram',
						},
					},
					{
						id: 'm-agent',
						contact: {
							sub: '42',
							iss: 'webitel',
						},
					},
				],
			});
			fetchMessageHistoryMock.mockResolvedValue(historyPage([], null));
			// the chats store loads the account at startup; the session only reads it
			await useChatAccountStore().load();
			const store = useChatSessionStore('chat-self');

			await store.load();
			await flushPromises();

			expect(store.selfMemberId).toBe('m-agent');
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

		it('keeps a message the socket delivered while the first page was in flight', async () => {
			let answer: (page: unknown) => void = () => {};
			fetchMessageHistoryMock.mockReturnValue(
				new Promise((resolve) => {
					answer = resolve;
				}),
			);
			const store = useChatSessionStore('chat-1');

			const loading = store.load();
			await flushPromises();
			store.receiveMessage({
				id: 'm2',
				threadId: 'chat-1',
				createdAt: '2000',
			} as never);
			answer({
				items: [
					{
						id: 'm1',
						createdAt: '1000',
					},
				],
			});
			await loading;

			expect(store.messages.map((shown) => shown.id)).toEqual([
				'm1',
				'm2',
			]);
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

	describe('refreshThread', () => {
		it('re-reads the thread and keeps the history', async () => {
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
			const refreshed = thread();
			fetchThreadMock.mockResolvedValue(refreshed);

			await store.refreshThread();

			expect(fetchThreadMock).toHaveBeenCalledTimes(2);
			expect(fetchMessageHistoryMock).toHaveBeenCalledOnce();
			expect(store.thread).toBe(refreshed);
			expect(store.messages.map((shown) => shown.id)).toEqual([
				'm1',
			]);
		});

		it('does nothing before the first load', async () => {
			const store = useChatSessionStore('chat-1');

			await store.refreshThread();

			expect(fetchThreadMock).not.toHaveBeenCalled();
		});

		it('keeps the last thread when the read fails', async () => {
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
			const loaded = store.thread;
			const failure = new Error('offline');
			fetchThreadMock.mockRejectedValue(failure);

			await store.refreshThread();

			expect(store.thread).toBe(loaded);
			expect(store.error).toBe(failure);
		});
	});

	describe('catchUp', () => {
		const ids = (store: ReturnType<typeof useChatSessionStore>) =>
			store.messages.map((shown) => shown.id);

		it('merges a page that overlaps the history and keeps the older pages', async () => {
			fetchMessageHistoryMock.mockResolvedValueOnce({
				items: [
					timedMessage('m2', 2000),
					timedMessage('m1', 1000),
				],
				nextCursor: {
					id: 'cursor-older',
				},
			});
			const store = useChatSessionStore('chat-1');
			await store.load();
			fetchMessageHistoryMock.mockResolvedValueOnce({
				items: [
					timedMessage('m3', 3000),
					timedMessage('m2', 2000),
				],
				nextCursor: {
					id: 'cursor-m2',
				},
			});

			await store.catchUp();

			expect(ids(store)).toEqual([
				'm1',
				'm2',
				'm3',
			]);
			expect(store.olderCursor).toBe('cursor-older');
		});

		// more than a page was written while the socket was down
		it('replaces the history when the page does not overlap it', async () => {
			fetchMessageHistoryMock.mockResolvedValueOnce({
				items: [
					timedMessage('m1', 1000),
				],
				nextCursor: {
					id: 'cursor-older',
				},
			});
			const store = useChatSessionStore('chat-1');
			await store.load();
			fetchMessageHistoryMock.mockResolvedValueOnce({
				items: [
					timedMessage('m40', 40_000),
					timedMessage('m39', 39_000),
				],
				nextCursor: {
					id: 'cursor-m39',
				},
			});

			await store.catchUp();

			expect(ids(store)).toEqual([
				'm39',
				'm40',
			]);
			expect(store.olderCursor).toBe('cursor-m39');
		});

		it('keeps a live edit that arrived during the read over the page’s older copy', async () => {
			fetchMessageHistoryMock.mockResolvedValueOnce({
				items: [
					timedMessage('m1', 1000),
				],
			});
			const store = useChatSessionStore('chat-1');
			await store.load();
			let answer: (page: unknown) => void = () => {};
			fetchMessageHistoryMock.mockReturnValueOnce(
				new Promise((resolve) => {
					answer = resolve;
				}),
			);

			const catchingUp = store.catchUp();
			await flushPromises();
			store.receiveMessage(timedMessage('m2', 2000, 'edited'));
			answer({
				items: [
					timedMessage('m2', 2000, 'original'),
					timedMessage('m1', 1000),
				],
			});
			await catchingUp;

			expect(store.messages.at(-1)).toEqual(timedMessage('m2', 2000, 'edited'));
		});

		it('does nothing before the first load', async () => {
			const store = useChatSessionStore('chat-1');

			await store.catchUp();

			expect(fetchThreadMock).not.toHaveBeenCalled();
		});

		it('keeps what is on screen when the read fails', async () => {
			fetchMessageHistoryMock.mockResolvedValueOnce({
				items: [
					timedMessage('m1', 1000),
				],
			});
			const store = useChatSessionStore('chat-1');
			await store.load();
			const failure = new Error('offline');
			fetchThreadMock.mockRejectedValueOnce(failure);

			await store.catchUp();

			expect(ids(store)).toEqual([
				'm1',
			]);
			expect(store.error).toBe(failure);
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

		it("disposes the chat's variables store with it", () => {
			useChatSessionStore('chat-1');
			useChatVariablesStore('chat-1');
			expect(
				getActivePinia()?.state.value['chat-variables:chat-1'],
			).toBeDefined();

			disposeChatSession('chat-1');

			expect(
				getActivePinia()?.state.value['chat-variables:chat-1'],
			).toBeUndefined();
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

	describe('session registry', () => {
		it('lists every chat that has a session', () => {
			useChatSessionStore('registry-4');

			expect(chatSessionIds()).toContain('registry-4');
			disposeChatSession('registry-4');
			expect(chatSessionIds()).not.toContain('registry-4');
		});

		it('tells whether a chat has a session, without creating one', () => {
			expect(hasChatSession('registry-1')).toBe(false);
			expect(getActivePinia()?.state.value['chat:registry-1']).toBeUndefined();

			useChatSessionStore('registry-1');

			expect(hasChatSession('registry-1')).toBe(true);
			disposeChatSession('registry-1');
			expect(hasChatSession('registry-1')).toBe(false);
		});

		it('disposes every session that is not kept', () => {
			useChatSessionStore('registry-2');
			useChatSessionStore('registry-3');

			retainChatSessions(
				new Set([
					'registry-2',
				]),
			);

			expect(hasChatSession('registry-2')).toBe(true);
			expect(hasChatSession('registry-3')).toBe(false);
			expect(getActivePinia()?.state.value['chat:registry-3']).toBeUndefined();
			disposeChatSession('registry-2');
		});
	});
});
