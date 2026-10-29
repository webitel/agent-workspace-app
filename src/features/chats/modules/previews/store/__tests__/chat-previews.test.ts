import { createTestingPinia } from '@pinia/testing';
import { flushPromises } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMessageHistoryMock = vi.fn();
const fetchThreadsMock = vi.fn();

vi.mock('../../../../api/chatSdk', () => ({
	messagesService: {
		fetchMessageHistory: (...args: unknown[]) =>
			fetchMessageHistoryMock(...args),
	},
	threadsService: {
		fetchThreads: (...args: unknown[]) => fetchThreadsMock(...args),
	},
}));

const accountStore = {
	account: {
		contact: {
			sub: '42',
			iss: 'webitel',
		},
	} as unknown,
};
vi.mock('../../../../store/chat-account', () => ({
	useChatAccountStore: () => accountStore,
}));

import { useChatPreviewsStore } from '../chat-previews';

const buildMessage = (overrides: Record<string, unknown> = {}) =>
	({
		id: 'm1',
		threadId: 't1',
		body: 'hello',
		createdAt: '1000',
		sender: {
			id: 'member-client',
			contact: {
				sub: 'client-1',
				iss: 'telegram',
			},
		},
		...overrides,
	}) as never;

/** Every listed chat is shown, which is all most of these cases need. */
const syncAll = (
	store: ReturnType<typeof useChatPreviewsStore>,
	threadIds: string[],
) => store.sync(threadIds, threadIds);

// the history endpoint answers newest first
const historyPage = (...messages: unknown[]) => ({
	items: messages,
});

describe('chat-previews store', () => {
	beforeEach(() => {
		fetchMessageHistoryMock.mockReset();
		fetchThreadsMock.mockReset();
		accountStore.account = {
			contact: {
				sub: '42',
				iss: 'webitel',
			},
		};
		setActivePinia(
			createTestingPinia({
				stubActions: false,
				createSpy: vi.fn,
			}),
		);
	});

	describe('unread', () => {
		const unreadThread = (id: string, unreadCount?: number) => ({
			id,
			unreadCount,
		});

		// before the first read answers, "nothing is unread" would be a gap
		it('holds no unread data until the unread chats have been read', () => {
			const store = useChatPreviewsStore();

			expect(store.hasUnreadData).toBe(false);
			expect(store.isUnread('t1')).toBe(false);
		});

		it('reads the chats with unread messages and keeps their counts', async () => {
			fetchThreadsMock.mockResolvedValue({
				items: [
					unreadThread('t1', 3),
					unreadThread('t2', 1),
				],
				next: false,
			});
			const store = useChatPreviewsStore();

			await store.loadUnread();

			expect(fetchThreadsMock).toHaveBeenCalledWith({
				unread: true,
				size: 100,
				page: 1,
			});
			expect(store.unreadByThread).toEqual({
				t1: 3,
				t2: 1,
			});
			expect(store.hasUnreadData).toBe(true);
			expect(store.isUnread('t1')).toBe(true);
			expect(store.isUnread('t9')).toBe(false);
		});

		// nothing unread is a fact once the read has answered
		it('counts a chat the backend lists as unread at least once', async () => {
			fetchThreadsMock.mockResolvedValue({
				items: [
					unreadThread('t1'),
				],
				next: false,
			});
			const store = useChatPreviewsStore();

			await store.loadUnread();

			expect(store.unreadByThread.t1).toBe(1);
		});

		it('reads every page', async () => {
			fetchThreadsMock
				.mockResolvedValueOnce({
					items: [
						unreadThread('t1', 1),
					],
					next: true,
				})
				.mockResolvedValueOnce({
					items: [
						unreadThread('t2', 2),
					],
					next: false,
				});
			const store = useChatPreviewsStore();

			await store.loadUnread();

			expect(fetchThreadsMock).toHaveBeenCalledTimes(2);
			expect(store.unreadByThread).toEqual({
				t1: 1,
				t2: 2,
			});
		});

		it('keeps what it had when a read fails', async () => {
			fetchThreadsMock.mockResolvedValueOnce({
				items: [
					unreadThread('t1', 2),
				],
				next: false,
			});
			const store = useChatPreviewsStore();
			await store.loadUnread();

			fetchThreadsMock.mockRejectedValueOnce(new Error('offline'));
			await store.loadUnread();

			expect(store.unreadByThread).toEqual({
				t1: 2,
			});
		});

		describe('counted from the socket', () => {
			it("raises the count for someone else's message on a listed chat", () => {
				const store = useChatPreviewsStore();
				syncAll(store, [
					't1',
				]);

				store.receiveMessage(buildMessage());
				store.receiveMessage(
					buildMessage({
						id: 'm2',
					}),
				);

				expect(store.unreadByThread.t1).toBe(2);
			});

			it("does not count the agent's own message", () => {
				const store = useChatPreviewsStore();
				syncAll(store, [
					't1',
				]);

				store.receiveMessage(
					buildMessage({
						sender: {
							contact: {
								sub: '42',
								iss: 'webitel',
							},
						},
					}),
				);

				expect(store.unreadByThread.t1).toBeUndefined();
			});

			// ADR-0001: no guess about who wrote it while the account is unknown
			it('does not count while the agent’s account is unknown', () => {
				accountStore.account = null;
				const store = useChatPreviewsStore();
				syncAll(store, [
					't1',
				]);

				store.receiveMessage(buildMessage());

				expect(store.unreadByThread.t1).toBeUndefined();
			});

			// an edit, or the echo of a message already counted
			it('does not count the same message twice', () => {
				const store = useChatPreviewsStore();
				syncAll(store, [
					't1',
				]);

				store.receiveMessage(buildMessage());
				store.receiveMessage(buildMessage());

				expect(store.unreadByThread.t1).toBe(1);
			});

			it('does not count a notice, which is nobody’s message', () => {
				const store = useChatPreviewsStore();
				syncAll(store, [
					't1',
				]);

				store.receiveMessage(
					buildMessage({
						system: {
							memberJoined: {},
						},
					}),
				);

				expect(store.unreadByThread.t1).toBeUndefined();
			});

			it('does not count a chat the list does not hold', () => {
				const store = useChatPreviewsStore();
				syncAll(store, [
					't1',
				]);

				store.receiveMessage(
					buildMessage({
						threadId: 't9',
					}),
				);

				expect(store.unreadByThread.t9).toBeUndefined();
			});

			// a listed chat the window is not showing is still counted
			it('counts a listed chat that is not shown', () => {
				const store = useChatPreviewsStore();
				store.sync(
					[
						't1',
						't2',
					],
					[
						't1',
					],
				);

				store.receiveMessage(
					buildMessage({
						threadId: 't2',
					}),
				);

				expect(store.unreadByThread.t2).toBe(1);
			});
		});

		describe('marking a chat read', () => {
			it('clears its count', () => {
				const store = useChatPreviewsStore();
				store.setUnreadCount('t1', 3);

				store.markRead('t1');

				expect(store.unreadByThread.t1).toBe(0);
				expect(store.isUnread('t1')).toBe(false);
			});

			it('counts again from zero when something new arrives', () => {
				const store = useChatPreviewsStore();
				syncAll(store, [
					't1',
				]);
				store.receiveMessage(buildMessage());
				store.markRead('t1');

				store.receiveMessage(
					buildMessage({
						id: 'm2',
					}),
				);

				expect(store.unreadByThread.t1).toBe(1);
			});
		});

		it('forgets the count of a chat that leaves the list', () => {
			const store = useChatPreviewsStore();
			syncAll(store, [
				't1',
			]);
			store.receiveMessage(buildMessage());

			syncAll(store, []);

			expect(store.unreadByThread.t1).toBeUndefined();
		});
	});

	// the window bounds the history reads: only shown chats are read
	describe('listed and shown', () => {
		it('reads the last message of the shown chats only', async () => {
			fetchMessageHistoryMock.mockResolvedValue(historyPage(buildMessage()));
			const store = useChatPreviewsStore();

			store.sync(
				[
					't1',
					't2',
				],
				[
					't1',
				],
			);
			await flushPromises();

			expect(fetchMessageHistoryMock).toHaveBeenCalledTimes(1);
			expect(fetchMessageHistoryMock).toHaveBeenCalledWith('t1', {
				size: 10,
			});
		});

		it('reads a chat when it comes into the window, and not again when it leaves it', async () => {
			fetchMessageHistoryMock.mockResolvedValue(historyPage(buildMessage()));
			const store = useChatPreviewsStore();
			store.sync(
				[
					't1',
					't2',
				],
				[
					't1',
				],
			);
			await flushPromises();

			store.sync(
				[
					't1',
					't2',
				],
				[
					't2',
				],
			);
			await flushPromises();
			store.sync(
				[
					't1',
					't2',
				],
				[
					't1',
				],
			);
			await flushPromises();

			expect(fetchMessageHistoryMock).toHaveBeenCalledTimes(2);
			expect(store.lastMessages.t1?.id).toBe('m1');
		});

		// a chat the window moved off still has a socket to follow
		it('keeps a chat’s last message current after it leaves the window', async () => {
			fetchMessageHistoryMock.mockResolvedValue(historyPage(buildMessage()));
			const store = useChatPreviewsStore();
			store.sync(
				[
					't1',
					't2',
				],
				[
					't1',
				],
			);
			await flushPromises();
			store.sync(
				[
					't1',
					't2',
				],
				[
					't2',
				],
			);

			store.receiveMessage(
				buildMessage({
					id: 'm2',
					createdAt: '2000',
				}),
			);

			expect(store.lastMessages.t1?.id).toBe('m2');
		});
	});

	describe('seeding', () => {
		it('reads the newest messages of a chat once it is listed', async () => {
			fetchMessageHistoryMock.mockResolvedValue(historyPage(buildMessage()));
			const store = useChatPreviewsStore();

			syncAll(store, [
				't1',
			]);
			await flushPromises();

			expect(fetchMessageHistoryMock).toHaveBeenCalledWith('t1', {
				size: 10,
			});
			expect(store.lastMessages.t1).toMatchObject({
				id: 'm1',
				body: 'hello',
				at: 1000,
				senderContact: {
					sub: 'client-1',
					iss: 'telegram',
				},
			});
		});

		it('does not read a chat again while it stays listed', async () => {
			fetchMessageHistoryMock.mockResolvedValue(historyPage(buildMessage()));
			const store = useChatPreviewsStore();

			syncAll(store, [
				't1',
			]);
			syncAll(store, [
				't1',
				't2',
			]);
			await flushPromises();

			expect(
				fetchMessageHistoryMock.mock.calls.filter(([id]) => id === 't1'),
			).toHaveLength(1);
		});

		// system notices sit on top of a fresh chat; the real last message is below
		it('looks past system notices for the real last message', async () => {
			fetchMessageHistoryMock.mockResolvedValue(
				historyPage(
					buildMessage({
						id: 'notice',
						system: {
							memberJoined: {},
						},
					}),
					buildMessage({
						id: 'm0',
						body: 'real',
					}),
				),
			);
			const store = useChatPreviewsStore();

			syncAll(store, [
				't1',
			]);
			await flushPromises();

			expect(store.lastMessages.t1.id).toBe('m0');
		});

		it('leaves the chat without a last message when the read fails, and retries on the next sync', async () => {
			fetchMessageHistoryMock.mockRejectedValueOnce(new Error('boom'));
			const store = useChatPreviewsStore();

			syncAll(store, [
				't1',
			]);
			await flushPromises();
			expect(store.lastMessages.t1).toBeUndefined();

			fetchMessageHistoryMock.mockResolvedValue(historyPage(buildMessage()));
			syncAll(store, [
				't1',
			]);
			await flushPromises();

			expect(store.lastMessages.t1.id).toBe('m1');
		});
	});

	describe('socket', () => {
		beforeEach(() => {
			fetchMessageHistoryMock.mockResolvedValue(historyPage());
		});

		it('takes a newer message for a listed chat', async () => {
			const store = useChatPreviewsStore();
			syncAll(store, [
				't1',
			]);
			await flushPromises();

			store.receiveMessage(
				buildMessage({
					id: 'm2',
					body: 'newer',
					createdAt: '2000',
				}),
			);

			expect(store.lastMessages.t1).toMatchObject({
				id: 'm2',
				body: 'newer',
			});
		});

		// the agent is in threads the list does not show (offers, closed chats)
		it('ignores a thread the list does not show', async () => {
			const store = useChatPreviewsStore();
			syncAll(store, [
				't1',
			]);
			await flushPromises();

			store.receiveMessage(
				buildMessage({
					threadId: 'other',
				}),
			);

			expect(store.lastMessages.other).toBeUndefined();
		});

		it('applies an edit of the last message', async () => {
			const store = useChatPreviewsStore();
			syncAll(store, [
				't1',
			]);
			await flushPromises();
			store.receiveMessage(buildMessage());

			store.receiveMessage(
				buildMessage({
					body: 'edited',
				}),
			);

			expect(store.lastMessages.t1.body).toBe('edited');
		});

		it('does not let the edit of an older message replace the last one', async () => {
			const store = useChatPreviewsStore();
			syncAll(store, [
				't1',
			]);
			await flushPromises();
			store.receiveMessage(
				buildMessage({
					id: 'm2',
					createdAt: '2000',
				}),
			);

			store.receiveMessage(
				buildMessage({
					id: 'm1',
					body: 'edited old',
					createdAt: '1000',
				}),
			);

			expect(store.lastMessages.t1.id).toBe('m2');
		});

		it('does not let a system notice replace the last message', async () => {
			const store = useChatPreviewsStore();
			syncAll(store, [
				't1',
			]);
			await flushPromises();
			store.receiveMessage(buildMessage());

			store.receiveMessage(
				buildMessage({
					id: 'notice',
					createdAt: '3000',
					system: {
						memberJoined: {},
					},
				}),
			);

			expect(store.lastMessages.t1.id).toBe('m1');
		});

		// a slow seed must not clobber what the socket already delivered
		it('keeps a socket message that beat a slow seed', async () => {
			let resolveSeed: (page: unknown) => void = () => {};
			fetchMessageHistoryMock.mockReturnValue(
				new Promise((resolve) => {
					resolveSeed = resolve;
				}),
			);
			const store = useChatPreviewsStore();
			syncAll(store, [
				't1',
			]);

			store.receiveMessage(
				buildMessage({
					id: 'm2',
					createdAt: '2000',
				}),
			);
			resolveSeed(historyPage(buildMessage()));
			await flushPromises();

			expect(store.lastMessages.t1.id).toBe('m2');
		});
	});

	describe('leaving the list', () => {
		it('forgets a chat that is no longer listed, and reads it afresh if it returns', async () => {
			fetchMessageHistoryMock.mockResolvedValue(historyPage(buildMessage()));
			const store = useChatPreviewsStore();
			syncAll(store, [
				't1',
			]);
			await flushPromises();

			syncAll(store, []);
			expect(store.lastMessages.t1).toBeUndefined();

			syncAll(store, [
				't1',
			]);
			await flushPromises();

			expect(fetchMessageHistoryMock).toHaveBeenCalledTimes(2);
			expect(store.lastMessages.t1.id).toBe('m1');
		});

		it('drops the answer of a read that outlived its chat', async () => {
			let resolveSeed: (page: unknown) => void = () => {};
			fetchMessageHistoryMock.mockReturnValue(
				new Promise((resolve) => {
					resolveSeed = resolve;
				}),
			);
			const store = useChatPreviewsStore();
			syncAll(store, [
				't1',
			]);

			syncAll(store, []);
			resolveSeed(historyPage(buildMessage()));
			await flushPromises();

			expect(store.lastMessages.t1).toBeUndefined();
		});
	});

	describe('reseeding', () => {
		it('reads every listed chat again', async () => {
			fetchMessageHistoryMock.mockResolvedValueOnce(
				historyPage(buildMessage()),
			);
			const store = useChatPreviewsStore();
			syncAll(store, [
				't1',
			]);
			await flushPromises();
			fetchMessageHistoryMock.mockResolvedValueOnce(
				historyPage(
					buildMessage({
						id: 'm2',
						body: 'written while the socket was down',
						createdAt: '2000',
					}),
				),
			);

			store.reseed();
			await flushPromises();

			expect(fetchMessageHistoryMock).toHaveBeenCalledTimes(2);
			expect(store.lastMessages.t1?.id).toBe('m2');
		});

		it('does not read a chat the list no longer shows', async () => {
			fetchMessageHistoryMock.mockResolvedValue(historyPage(buildMessage()));
			const store = useChatPreviewsStore();
			syncAll(store, [
				't1',
			]);
			await flushPromises();
			syncAll(store, []);

			store.reseed();
			await flushPromises();

			expect(fetchMessageHistoryMock).toHaveBeenCalledOnce();
		});
	});
});
