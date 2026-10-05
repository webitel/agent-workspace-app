import { createTestingPinia } from '@pinia/testing';
import { flushPromises } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMessageHistoryMock = vi.fn();

vi.mock('../../../../api/chatSdk', () => ({
	messagesService: {
		fetchMessageHistory: (...args: unknown[]) =>
			fetchMessageHistoryMock(...args),
	},
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
		},
		...overrides,
	}) as never;

// the history endpoint answers newest first
const historyPage = (...messages: unknown[]) => ({
	items: messages,
});

describe('chat-previews store', () => {
	beforeEach(() => {
		fetchMessageHistoryMock.mockReset();
		setActivePinia(
			createTestingPinia({
				stubActions: false,
				createSpy: vi.fn,
			}),
		);
	});

	describe('seeding', () => {
		it('reads the newest messages of a chat once it is listed', async () => {
			fetchMessageHistoryMock.mockResolvedValue(historyPage(buildMessage()));
			const store = useChatPreviewsStore();

			store.sync([
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
				senderId: 'member-client',
			});
		});

		it('does not read a chat again while it stays listed', async () => {
			fetchMessageHistoryMock.mockResolvedValue(historyPage(buildMessage()));
			const store = useChatPreviewsStore();

			store.sync([
				't1',
			]);
			store.sync([
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

			store.sync([
				't1',
			]);
			await flushPromises();

			expect(store.lastMessages.t1.id).toBe('m0');
		});

		it('leaves the chat without a last message when the read fails, and retries on the next sync', async () => {
			fetchMessageHistoryMock.mockRejectedValueOnce(new Error('boom'));
			const store = useChatPreviewsStore();

			store.sync([
				't1',
			]);
			await flushPromises();
			expect(store.lastMessages.t1).toBeUndefined();

			fetchMessageHistoryMock.mockResolvedValue(historyPage(buildMessage()));
			store.sync([
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
			store.sync([
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
			store.sync([
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
			store.sync([
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
			store.sync([
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
			store.sync([
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
			store.sync([
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
			store.sync([
				't1',
			]);
			await flushPromises();

			store.sync([]);
			expect(store.lastMessages.t1).toBeUndefined();

			store.sync([
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
			store.sync([
				't1',
			]);

			store.sync([]);
			resolveSeed(historyPage(buildMessage()));
			await flushPromises();

			expect(store.lastMessages.t1).toBeUndefined();
		});
	});
});
