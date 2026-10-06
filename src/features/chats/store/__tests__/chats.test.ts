import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

const subscribeTaskMock = vi.fn();
const getClientMock = vi.fn(() => ({
	subscribeTask: subscribeTaskMock,
}));
const tasks = ref<
	{
		id?: number;
		channel: string;
		offeringAt?: number;
		bridgedAt?: number;
		closedAt?: number;
	}[]
>([]);

const offers = {
	initialize: vi.fn(),
	// biome-ignore lint/suspicious/noExplicitAny: test double for the store action
	notify: vi.fn() as any,
	dismiss: vi.fn(),
	retainOnly: vi.fn(),
};

vi.mock('../../../../ui/notifications/modules/offers/store/offers', () => ({
	useOffersStore: () => offers,
}));

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		getClient: getClientMock,
		tasks,
	}),
}));

const loadMock = vi.fn();
const refreshThreadMock = vi.fn();
const catchUpMock = vi.fn();
const receiveMessageMock = vi.fn();
// chats that have a session, the way the real registry tracks them
const sessionIds = new Set<string>();
let sessionInitialized = false;
const useChatSessionStoreMock = vi.fn((chatId: string) => {
	sessionIds.add(chatId);
	return {
		initialized: sessionInitialized,
		load: loadMock,
		refreshThread: refreshThreadMock,
		catchUp: catchUpMock,
		receiveMessage: receiveMessageMock,
	};
});
const retainChatSessionsMock = vi.fn();

vi.mock('../chat-session', () => ({
	useChatSessionStore: (chatId: string) => useChatSessionStoreMock(chatId),
	hasChatSession: (chatId: string) => sessionIds.has(chatId),
	chatSessionIds: () => [
		...sessionIds,
	],
	retainChatSessions: (...args: unknown[]) => retainChatSessionsMock(...args),
}));

const loadAccountMock = vi.fn();

vi.mock('../chat-account', () => ({
	useChatAccountStore: () => ({
		load: loadAccountMock,
	}),
}));

const receivePreviewMessageMock = vi.fn();
const reseedPreviewsMock = vi.fn();

vi.mock('../../modules/previews/store/chat-previews', () => ({
	useChatPreviewsStore: () => ({
		receiveMessage: receivePreviewMessageMock,
		reseed: reseedPreviewsMock,
	}),
}));

const connectChatsSocketMock = vi.fn();
// Captures the handler chats registers so tests can emit a socket message.
let threadMessageHandler: ((message: { threadId?: string }) => void) | null =
	null;
const onThreadMessageMock = vi.fn(
	(cb: (message: { threadId?: string }) => void) => {
		threadMessageHandler = cb;
		return () => {};
	},
);

let reconnectedHandler: (() => void) | null = null;
const onReconnectedMock = vi.fn((callback: () => void) => {
	reconnectedHandler = callback;
	return () => {};
});

vi.mock('../../composables/useChatsSocket', () => ({
	useChatsSocket: () => ({
		connect: connectChatsSocketMock,
		disconnect: vi.fn(),
		onThreadMessage: onThreadMessageMock,
		onReconnected: onReconnectedMock,
	}),
}));

// Router singleton: push mirrors the URL so the "already there" guard can be
// exercised (a repeat main-open must not re-push).
const routerPushMock = vi.fn((path: string) => {
	routerCurrentRoute.value.params.threadId =
		String(path).split('/').pop() ?? '';
});
const routerCurrentRoute = {
	value: {
		params: {} as Record<string, string>,
	},
};

vi.mock('../../../../app/router', () => ({
	// Getters keep the factory hoist-safe: the outer consts are read lazily at
	// access time, not when the factory itself is evaluated.
	router: {
		push: (...args: unknown[]) =>
			routerPushMock(
				...(args as [
					string,
				]),
			),
		get currentRoute() {
			return routerCurrentRoute;
		},
	},
}));

import { useChatsStore } from '../chats';

// `null`, not `undefined`: passing undefined would re-apply the default
const buildListed = (id: number, threadId: string | null) => ({
	id,
	channel: 'im',
	offeringAt: 1,
	bridgedAt: 2,
	closedAt: 0,
	thread: threadId
		? {
				id: threadId,
			}
		: undefined,
});

describe('chats store', () => {
	/**
	 * The store watches a module-level `tasks` ref. Without disposing, every
	 * previous test's store keeps watching it, so a later mutation fires all of
	 * them and `notify.mock.calls[0]` belongs to a stale store.
	 */
	let pinia: ReturnType<typeof createTestingPinia> | null = null;

	afterEach(() => {
		// `_s` is pinia's internal store registry; `$dispose` on each is public
		const registry = (
			pinia as unknown as {
				_s?: Map<
					string,
					{
						$dispose: () => void;
					}
				>;
			} | null
		)?._s;
		registry?.forEach((store) => {
			store.$dispose();
		});
		pinia = null;
	});

	beforeEach(() => {
		pinia = createTestingPinia({
			stubActions: false,
			createSpy: vi.fn,
		});
		setActivePinia(pinia);
		vi.clearAllMocks();
		sessionIds.clear();
		sessionInitialized = false;
		tasks.value = [];
		threadMessageHandler = null;
		reconnectedHandler = null;
		routerCurrentRoute.value.params = {};
	});

	// it does not change within a session, so one read at startup serves every chat
	it('loads the agent account once on initialize', () => {
		const store = useChatsStore();

		store.initialize();

		expect(loadAccountMock).toHaveBeenCalledOnce();
	});

	it('subscribes to tasks on the connected client on initialize', () => {
		const store = useChatsStore();

		store.initialize();

		expect(subscribeTaskMock).toHaveBeenCalledOnce();
		expect(subscribeTaskMock).toHaveBeenCalledWith(expect.any(Function));
	});

	describe('chats socket routing', () => {
		it('connects the chats socket and registers a message handler on initialize', () => {
			const store = useChatsStore();

			store.initialize();

			expect(connectChatsSocketMock).toHaveBeenCalledOnce();
			expect(onThreadMessageMock).toHaveBeenCalledWith(expect.any(Function));
		});

		it("routes a live message to the chat's session", () => {
			const store = useChatsStore();
			store.initialize();
			store.openChat('chat-1');
			useChatSessionStoreMock.mockClear();

			threadMessageHandler?.({
				threadId: 'chat-1',
			});

			expect(useChatSessionStoreMock).toHaveBeenCalledWith('chat-1');
			expect(receiveMessageMock).toHaveBeenCalledWith({
				threadId: 'chat-1',
			});
		});

		// the list shows every accepted chat, not only the open ones
		// whatever was written while the socket was down was never pushed
		it('catches up the list and every chat session once the socket is back', () => {
			const store = useChatsStore();
			store.initialize();
			store.openChat('chat-1');
			store.openChat('chat-2', 'minimized');

			reconnectedHandler?.();

			expect(reseedPreviewsMock).toHaveBeenCalledOnce();
			expect(catchUpMock).toHaveBeenCalledTimes(2);
		});

		// a listed chat's session outlives its window and must stay current
		it('keeps routing to a session whose window was closed', () => {
			const store = useChatsStore();
			store.initialize();
			store.openChat('chat-1');
			store.closeChat('chat-1');

			threadMessageHandler?.({
				threadId: 'chat-1',
			});

			expect(receiveMessageMock).toHaveBeenCalledWith({
				threadId: 'chat-1',
			});
		});

		it('keeps the previews current for a chat that is not open', () => {
			const store = useChatsStore();
			store.initialize();

			threadMessageHandler?.({
				threadId: 'chat-unknown',
			});

			expect(receivePreviewMessageMock).toHaveBeenCalledWith({
				threadId: 'chat-unknown',
			});
		});

		it('ignores a message for a chat with no session', () => {
			const store = useChatsStore();
			store.initialize();

			threadMessageHandler?.({
				threadId: 'chat-unknown',
			});

			expect(receiveMessageMock).not.toHaveBeenCalled();
		});
	});

	it('exposes only im-channel tasks in chatTaskList', () => {
		tasks.value = [
			{
				channel: 'im',
				offeringAt: 1,
				bridgedAt: 2,
			},
			{
				channel: 'call',
				offeringAt: 1,
				bridgedAt: 2,
			},
			{
				channel: 'im',
				offeringAt: 1,
				bridgedAt: 2,
			},
		];
		const store = useChatsStore();

		expect(store.chatTaskList).toHaveLength(2);
		expect(store.chatTaskList?.every((task) => task.channel === 'im')).toBe(
			true,
		);
	});

	/**
	 * The offer card is the only surface for an offered chat; a row here would
	 * invite the agent to open a thread they are not a member of yet.
	 */
	it('keeps offered chats out of chatTaskList', () => {
		tasks.value = [
			{
				channel: 'im',
				offeringAt: 1,
				bridgedAt: 0,
				closedAt: 0,
			},
			{
				channel: 'im',
				offeringAt: 1,
				bridgedAt: 2,
				closedAt: 0,
			},
		];
		const store = useChatsStore();

		expect(store.chatTaskList).toHaveLength(1);
		expect(store.incomingOffers).toHaveLength(1);
	});

	describe('incoming offers', () => {
		// `null`, not `undefined`: passing undefined would re-apply the default
		const buildOffer = (id = 1, threadId: string | null = 'thread-1') => ({
			id,
			channel: 'im',
			offeringAt: 1,
			bridgedAt: 0,
			closedAt: 0,
			displayName: 'John Smith',
			displayNumber: '@john',
			thread: threadId
				? {
						id: threadId,
						lastMsg: 'hello',
					}
				: undefined,
			accept: vi.fn(async () => {}),
			decline: vi.fn(async () => {}),
		});

		it('raises an offer when a chat starts being offered', async () => {
			const store = useChatsStore();
			store.initialize();

			tasks.value = [
				buildOffer(),
			];
			await nextTick();

			expect(offers.notify).toHaveBeenCalledTimes(1);
			expect(offers.notify.mock.calls[0][0].id).toBe('1');
		});

		/**
		 * Derived, not pushed: the card leaves on every exit path without the store
		 * enumerating task actions.
		 */
		it('withdraws the offer once the chat stops being offered', async () => {
			const store = useChatsStore();
			store.initialize();

			tasks.value = [
				buildOffer(),
			];
			await nextTick();

			tasks.value[0].bridgedAt = 2;
			await nextTick();

			expect(offers.retainOnly).toHaveBeenLastCalledWith('chat', []);
		});

		it('accepts the chat and opens it', async () => {
			const store = useChatsStore();
			store.initialize();

			const offer = buildOffer();
			tasks.value = [
				offer,
			];
			await nextTick();

			await offers.notify.mock.calls[0][0].onAccept();

			expect(offer.accept).toHaveBeenCalledTimes(1);
			expect(store.isOpen('thread-1')).toBe(true);
		});

		it('declines without opening the chat', async () => {
			const store = useChatsStore();
			store.initialize();

			const offer = buildOffer();
			tasks.value = [
				offer,
			];
			await nextTick();

			await offers.notify.mock.calls[0][0].onDecline();

			expect(offer.decline).toHaveBeenCalledTimes(1);
			expect(store.isOpen('thread-1')).toBe(false);
		});

		/** AC_06.01.04: the body navigates, it does not accept. */
		it('opens the chat from the card body without accepting', async () => {
			const store = useChatsStore();
			store.initialize();

			const offer = buildOffer();
			tasks.value = [
				offer,
			];
			await nextTick();

			offers.notify.mock.calls[0][0].onBodyClick();

			expect(offer.accept).not.toHaveBeenCalled();
			expect(store.isOpen('thread-1')).toBe(true);
		});

		it('leaves the card unclickable when the task carries no thread', async () => {
			const store = useChatsStore();
			store.initialize();

			tasks.value = [
				buildOffer(2, null),
			];
			await nextTick();

			expect(offers.notify.mock.calls[0][0].onBodyClick).toBeUndefined();
		});
	});

	describe('openChat', () => {
		// switching windows, or reopening a kept session: the socket kept its
		// history current, only the thread's read states are re-read
		it('re-reads only the thread of a session that already loaded', () => {
			sessionInitialized = true;
			const store = useChatsStore();

			store.openChat('chat-1');

			expect(refreshThreadMock).toHaveBeenCalledOnce();
			expect(loadMock).not.toHaveBeenCalled();
		});

		it('opens a chat as main and warms its session store', () => {
			const store = useChatsStore();

			store.openChat('chat-1');

			expect(store.isOpen('chat-1')).toBe(true);
			expect(store.mainChat?.id).toBe('chat-1');
			expect(useChatSessionStoreMock).toHaveBeenCalledWith('chat-1');
			expect(loadMock).toHaveBeenCalledOnce();
		});

		it('pushes the route when opening as main', () => {
			const store = useChatsStore();

			store.openChat('chat-1');

			expect(routerPushMock).toHaveBeenCalledWith('/chats/chat-1');
		});

		it('does not push when opening as minimized', () => {
			const store = useChatsStore();

			store.openChat('chat-1', 'minimized');

			expect(routerPushMock).not.toHaveBeenCalled();
		});

		it('does not re-push when the route already points at the chat', () => {
			const store = useChatsStore();

			store.openChat('chat-1');
			store.openChat('chat-1');

			expect(routerPushMock).toHaveBeenCalledOnce();
		});

		it('demotes the previous main when a new chat opens as main', () => {
			const store = useChatsStore();

			store.openChat('chat-1');
			store.openChat('chat-2');

			expect(store.mainChat?.id).toBe('chat-2');
			expect(store.minimizedChats.map((chat) => chat.id)).toEqual([
				'chat-1',
			]);
		});

		it('does not duplicate an already open chat', () => {
			const store = useChatsStore();

			store.openChat('chat-1');
			store.openChat('chat-1', 'minimized');

			expect(store.openChats).toHaveLength(1);
			expect(store.mainChat).toBeUndefined();
			expect(store.minimizedChats.map((chat) => chat.id)).toEqual([
				'chat-1',
			]);
		});
	});

	describe('setMode', () => {
		it('keeps a single main window across mode changes', () => {
			const store = useChatsStore();
			store.openChat('chat-1');
			store.openChat('chat-2', 'minimized');

			store.setMode('chat-2', 'main');

			expect(store.mainChat?.id).toBe('chat-2');
			expect(store.minimizedChats.map((chat) => chat.id)).toEqual([
				'chat-1',
			]);
		});

		it('ignores unknown chat ids', () => {
			const store = useChatsStore();

			store.setMode('missing', 'main');

			expect(store.openChats).toHaveLength(0);
		});
	});

	describe('closeChat', () => {
		it('removes the window and keeps the session of a listed chat', () => {
			tasks.value = [
				buildListed(1, 'chat-1'),
			];
			const store = useChatsStore();
			store.openChat('chat-1');

			store.closeChat('chat-1');

			expect(store.isOpen('chat-1')).toBe(false);
			expect(retainChatSessionsMock).toHaveBeenLastCalledWith(
				new Set([
					'chat-1',
				]),
			);
		});

		it('releases the session of a chat that was never listed', () => {
			const store = useChatsStore();
			store.openChat('chat-9');

			store.closeChat('chat-9');

			expect(retainChatSessionsMock).toHaveBeenLastCalledWith(new Set());
		});
	});

	describe('chat sessions follow the list', () => {
		it('releases the session of a chat that leaves the list', async () => {
			tasks.value = [
				buildListed(1, 'chat-1'),
			];
			const store = useChatsStore();
			store.initialize();

			tasks.value = [];
			await nextTick();

			expect(retainChatSessionsMock).toHaveBeenLastCalledWith(new Set());
		});

		// the task was released, but the agent still has the window open
		it('keeps the session while the chat that left still has a window', async () => {
			tasks.value = [
				buildListed(1, 'chat-1'),
			];
			const store = useChatsStore();
			store.initialize();
			store.openChat('chat-1');

			tasks.value = [];
			await nextTick();

			expect(retainChatSessionsMock).toHaveBeenLastCalledWith(
				new Set([
					'chat-1',
				]),
			);
		});
	});
	describe('ending a chat', () => {
		it('closes the chat task', async () => {
			const store = useChatsStore();
			const task = {
				close: vi.fn(() => Promise.resolve({})),
			};

			await store.endChat(task as never);

			expect(task.close).toHaveBeenCalledOnce();
		});

		it('passes a failure on to the caller', async () => {
			const store = useChatsStore();
			const task = {
				close: vi.fn(() => Promise.reject(new Error('offline'))),
			};

			await expect(store.endChat(task as never)).rejects.toThrow('offline');
		});

		it('does not touch the open window', async () => {
			const store = useChatsStore();
			store.openChat('chat-1');

			await store.endChat({
				close: vi.fn(() => Promise.resolve({})),
			} as never);

			expect(store.isOpen('chat-1')).toBe(true);
		});
	});
});
