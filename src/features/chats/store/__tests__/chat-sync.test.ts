import { createTestingPinia } from '@pinia/testing';
import { flushPromises } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

/**
 * The chat session and chat previews stores, driven together through the chats
 * coordinator and the real chats-socket composable. Only the SDK's REST services
 * and its socket client are faked, so these read as the app's behaviour rather
 * than as one store's contract.
 */

type FakeMessage = {
	id: string;
	threadId: string;
	body?: string;
	createdAt: string;
	sender: {
		contact: {
			sub: string;
			iss: string;
		};
	};
};

const message = (id: string, at: number, threadId = 't1'): FakeMessage => ({
	id,
	threadId,
	body: `text of ${id}`,
	createdAt: String(at),
	sender: {
		contact: {
			sub: 'client-1',
			iss: 'telegram',
		},
	},
});

// --- SDK REST services -------------------------------------------------------

/** What the history endpoint holds per thread, newest first. */
const histories = new Map<string, FakeMessage[]>();
/** Older pages, served when the session asks past its first one. */
const olderPages = new Map<string, FakeMessage[]>();
/** Set to hold the session's first history page open. */
let holdSessionHistory: Promise<void> | null = null;

const fetchThreadMock = vi.fn();
const sessionHistoryMock = vi.fn();
const previewHistoryMock = vi.fn();

vi.mock('../../api/chatSdk', () => ({
	serviceConfig: {},
	accountService: {
		getAccount: vi.fn().mockResolvedValue({
			contact: {
				sub: '42',
				iss: 'webitel',
			},
		}),
	},
	threadsService: {
		fetchThread: (...args: unknown[]) => fetchThreadMock(...args),
		locateVariables: vi.fn().mockResolvedValue({
			variables: {},
		}),
	},
	messagesService: {
		fetchMessageHistory: (...args: unknown[]) => previewHistoryMock(...args),
	},
}));

// --- SDK socket client -------------------------------------------------------

let sdkMessageHandler: ((data: unknown) => void) | null = null;
const stateHandlers = new Map<string, ((payload: unknown) => void)[]>();
const socketConnectMock = vi.fn();

vi.mock('@webitel/chat-web-sdk', () => ({
	MessageAttachmentType: {
		Images: 'images',
		Documents: 'documents',
	},
	ChatsSocketMessage: {
		ThreadMessage: 'messageEvent',
	},
	ChatsSocketConnectionStatus: {
		Idle: 'idle',
		Connecting: 'connecting',
		Connected: 'connected',
		Disconnected: 'disconnected',
		Error: 'error',
	},
	createSocketConfig: (config: unknown) => config,
	createChatsSocketClient: () => ({
		connect: socketConnectMock,
		disconnect: vi.fn(),
		onMessage: (_event: string, callback: (data: unknown) => void) => {
			sdkMessageHandler = callback;
		},
		onState: (state: string, callback: (payload: unknown) => void) => {
			stateHandlers.set(state, [
				...(stateHandlers.get(state) ?? []),
				callback,
			]);
		},
	}),
}));

/** The server pushes a message over the chats socket. */
const pushMessage = (pushed: FakeMessage) => sdkMessageHandler?.(pushed);
/** The SDK reports a connection state, the way its `onclose`/`onerror` do. */
const enterState = (state: string) => {
	for (const handler of stateHandlers.get(state) ?? []) handler({});
};

// --- app singletons ----------------------------------------------------------

const tasks = ref<unknown[]>([]);

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		getClient: () => ({
			subscribeTask: vi.fn(),
		}),
		tasks,
	}),
}));

vi.mock('../../../../ui/notifications/modules/offers/store/offers', () => ({
	useOffersStore: () => ({
		initialize: vi.fn(),
		notify: vi.fn(),
		dismiss: vi.fn(),
		retainOnly: vi.fn(),
	}),
}));

vi.mock('../../../../app/router', () => ({
	router: {
		push: vi.fn(),
		currentRoute: {
			value: {
				params: {},
			},
		},
	},
}));

import { useChatsSocket } from '../../composables/useChatsSocket';
import { useChatListStore } from '../../modules/previews/store/chat-list';
import { useChatPreviewsStore } from '../../modules/previews/store/chat-previews';
import { retainChatSessions, useChatSessionStore } from '../chat-session';
import { useChatVariablesStore } from '../chat-variables';
import { useChatsStore } from '../chats';

/** An accepted chat task, as the SDK feed holds it. */
const listedTask = (threadId: string) => ({
	id: Number(threadId.replace(/\D/g, '')) || 1,
	channel: 'im',
	offeringAt: 1,
	bridgedAt: 2,
	closedAt: 0,
	thread: {
		id: threadId,
	},
});

const messageIds = (threadId: string) =>
	useChatSessionStore(threadId).messages.map((shown) => shown.id);

describe('chat session and chat previews, together', () => {
	let pinia: ReturnType<typeof createTestingPinia>;

	beforeEach(() => {
		pinia = createTestingPinia({
			stubActions: false,
			createSpy: vi.fn,
		});
		setActivePinia(pinia);
		vi.clearAllMocks();
		tasks.value = [];
		histories.clear();
		olderPages.clear();
		holdSessionHistory = null;
		sdkMessageHandler = null;
		stateHandlers.clear();

		socketConnectMock.mockResolvedValue(undefined);
		previewHistoryMock.mockImplementation(async (threadId: string) => ({
			items: histories.get(threadId) ?? [],
		}));
		fetchThreadMock.mockImplementation(async (threadId: string) => ({
			id: threadId,
			fetchMessageHistory: async (params: { cursorId?: string }) => {
				sessionHistoryMock(threadId, params);
				if (params.cursorId) {
					return {
						items: olderPages.get(threadId) ?? [],
					};
				}
				const items = histories.get(threadId) ?? [];
				if (holdSessionHistory) await holdSessionHistory;
				return {
					items,
					nextCursor: olderPages.has(threadId)
						? {
								id: 'older',
							}
						: undefined,
				};
			},
		}));
	});

	afterEach(() => {
		// the session registry is module state, shared by every test
		retainChatSessions(new Set());
		useChatsSocket().disconnect();
		(
			pinia as unknown as {
				_s: Map<
					string,
					{
						$dispose: () => void;
					}
				>;
			}
		)._s.forEach((store) => {
			store.$dispose();
		});
	});

	describe('a chat session lives as long as its chat is listed', () => {
		it('keeps scrolled-back history across closing and reopening the window', async () => {
			histories.set('t1', [
				message('m3', 3000),
			]);
			olderPages.set('t1', [
				message('m2', 2000),
				message('m1', 1000),
			]);
			tasks.value = [
				listedTask('t1'),
			];
			const chats = useChatsStore();
			chats.initialize();

			chats.openChat('t1');
			await flushPromises();
			await useChatSessionStore('t1').loadMore();
			chats.closeChat('t1');
			chats.openChat('t1');
			await flushPromises();

			expect(messageIds('t1')).toEqual([
				'm1',
				'm2',
				'm3',
			]);
		});

		it('re-reads only the thread, not its history, when a retained chat is shown again', async () => {
			histories.set('t1', [
				message('m1', 1000),
			]);
			tasks.value = [
				listedTask('t1'),
			];
			const chats = useChatsStore();
			chats.initialize();

			chats.openChat('t1');
			await flushPromises();
			const readsBeforeReopening = sessionHistoryMock.mock.calls.length;
			chats.closeChat('t1');
			chats.openChat('t1');
			await flushPromises();

			// read states and delivery ticks come from the thread
			expect(fetchThreadMock).toHaveBeenCalledTimes(2);
			expect(sessionHistoryMock).toHaveBeenCalledTimes(readsBeforeReopening);
		});

		it('keeps a closed window current from the socket', async () => {
			histories.set('t1', [
				message('m1', 1000),
			]);
			tasks.value = [
				listedTask('t1'),
			];
			const chats = useChatsStore();
			chats.initialize();
			chats.openChat('t1');
			await flushPromises();
			chats.closeChat('t1');

			pushMessage(message('m2', 2000));
			chats.openChat('t1');
			await flushPromises();

			expect(messageIds('t1')).toEqual([
				'm1',
				'm2',
			]);
		});

		it('disposes the session and its variables once the chat leaves the list, not before', async () => {
			tasks.value = [
				listedTask('t1'),
			];
			const chats = useChatsStore();
			chats.initialize();
			chats.openChat('t1');
			await flushPromises();
			await useChatVariablesStore('t1').refresh();
			chats.closeChat('t1');

			expect(pinia.state.value['chat:t1']).toBeDefined();

			tasks.value = [];
			await flushPromises();

			expect(pinia.state.value['chat:t1']).toBeUndefined();
			expect(pinia.state.value['chat-variables:t1']).toBeUndefined();
		});

		it('disposes a deep-linked chat that was never listed when its window closes', async () => {
			const chats = useChatsStore();
			chats.initialize();
			chats.openChat('t9');
			await flushPromises();

			chats.closeChat('t9');

			expect(pinia.state.value['chat:t9']).toBeUndefined();
		});
	});

	describe('loading a chat', () => {
		it('does not lose a message that arrives while the window is loading', async () => {
			histories.set('t1', [
				message('m1', 1000),
			]);
			tasks.value = [
				listedTask('t1'),
			];
			let releaseHistory = () => {};
			holdSessionHistory = new Promise((resolve) => {
				releaseHistory = resolve;
			});
			const chats = useChatsStore();
			chats.initialize();

			chats.openChat('t1');
			await flushPromises();
			pushMessage(message('m2', 2000));
			releaseHistory();
			await flushPromises();

			expect(messageIds('t1')).toEqual([
				'm1',
				'm2',
			]);
		});
	});

	// real timers on purpose: flushPromises needs an unfaked timer, so these
	// wait out the real 1s first retry with vi.waitFor
	describe('a dropped chats socket', () => {
		it('connects again after the socket drops', async () => {
			const chats = useChatsStore();
			chats.initialize();
			await flushPromises();

			enterState('disconnected');

			await vi.waitFor(
				() => {
					expect(socketConnectMock).toHaveBeenCalledTimes(2);
				},
				{
					timeout: 3_000,
				},
			);
		});

		it('catches up the list and a closed window’s retained session', async () => {
			histories.set('t1', [
				message('m1', 1000),
			]);
			tasks.value = [
				listedTask('t1'),
			];
			const chats = useChatsStore();
			chats.initialize();
			// the list store is what hands the listed chats to the previews
			useChatListStore();
			chats.openChat('t1');
			await flushPromises();
			chats.closeChat('t1');

			// m2 is written while the socket is down, so it is never pushed
			enterState('disconnected');
			histories.set('t1', [
				message('m2', 2000),
				message('m1', 1000),
			]);

			await vi.waitFor(
				() => {
					expect(useChatPreviewsStore().lastMessages.t1?.id).toBe('m2');
					expect(messageIds('t1')).toEqual([
						'm1',
						'm2',
					]);
				},
				{
					timeout: 3_000,
				},
			);
		});
	});
});
