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
		onState: vi.fn(),
	}),
}));

/** The server pushes a message over the chats socket. */
const pushMessage = (pushed: FakeMessage) => sdkMessageHandler?.(pushed);

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
import { useChatSessionStore } from '../chat-session';
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
});
