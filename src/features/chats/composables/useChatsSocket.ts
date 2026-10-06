import {
	ChatsSocketConnectionStatus,
	ChatsSocketMessage,
	createChatsSocketClient,
	createSocketConfig,
} from '@webitel/chat-web-sdk';
import { shallowRef } from 'vue';

import { serviceConfig } from '../api/chatSdk';
import type { IMessage } from '../types/ChatSession.types';

type ChatsSocketClient = ReturnType<typeof createChatsSocketClient>;

const FIRST_RETRY_DELAY = 1_000;
const MAX_RETRY_DELAY = 30_000;

// Module-level singleton: the chats socket is one connection for the whole app,
// covering every open session. Handlers live in a Set so consumers can add/remove
// their own callbacks — the SDK exposes no off(), only onMessage().
const client = shallowRef<ChatsSocketClient | null>(null);
const messageHandlers = new Set<(message: IMessage) => void>();
const reconnectHandlers = new Set<() => void>();
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryDelay = FIRST_RETRY_DELAY;

/**
 * A dropped socket is connected again here rather than by the SDK, whose
 * `reconnect()` is not implemented yet. Its client can `connect()` again and
 * keeps the handlers it was given, so the same client is reused: after 1s,
 * doubling up to 30s, until an attempt is answered.
 */
function scheduleRetry(socketClient: ChatsSocketClient) {
	// a drop reports both `error` and `disconnected`, and one attempt is enough;
	// a client disconnected on purpose is no longer `client` and is left alone
	if (retryTimer || client.value !== socketClient) return;
	retryTimer = setTimeout(() => {
		retryTimer = null;
		void attemptConnect(socketClient, {
			isRetry: true,
		});
	}, retryDelay);
	retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
}

async function attemptConnect(
	socketClient: ChatsSocketClient,
	{
		isRetry,
	}: {
		isRetry: boolean;
	},
) {
	try {
		await socketClient.connect();
	} catch (err) {
		// the failed attempt reports a state change, which schedules the next one
		if (!isRetry) console.error('Failed to connect chats socket', err);
		return;
	}
	if (client.value !== socketClient) return;
	retryDelay = FIRST_RETRY_DELAY;
	// whatever was written while the socket was down was never pushed
	if (isRetry) {
		reconnectHandlers.forEach((handler) => {
			handler();
		});
	}
}

export function useChatsSocket() {
	async function connect(): Promise<void> {
		if (client.value) return;

		const socketConfig = createSocketConfig({
			baseUrl: import.meta.env.VITE_CHAT_WEB_SOCKET_URL,
			accessToken: localStorage.getItem('access-token') ?? '',
		});

		const socketClient = createChatsSocketClient({
			socketConfig,
			serviceConfig,
		});

		socketClient.onMessage(ChatsSocketMessage.ThreadMessage, (data) => {
			messageHandlers.forEach((handler) => {
				handler(data as IMessage);
			});
		});
		socketClient.onState(ChatsSocketConnectionStatus.Disconnected, () => {
			scheduleRetry(socketClient);
		});
		socketClient.onState(ChatsSocketConnectionStatus.Error, () => {
			scheduleRetry(socketClient);
		});

		client.value = socketClient;

		await attemptConnect(socketClient, {
			isRetry: false,
		});
	}

	function disconnect(): void {
		if (retryTimer) clearTimeout(retryTimer);
		retryTimer = null;
		retryDelay = FIRST_RETRY_DELAY;
		// cleared before the SDK is told: it reports `disconnected` synchronously,
		// and that must not read as a drop worth retrying
		const socketClient = client.value;
		client.value = null;
		socketClient?.disconnect();
	}

	function onThreadMessage(callback: (message: IMessage) => void): () => void {
		messageHandlers.add(callback);
		return () => messageHandlers.delete(callback);
	}

	/** Called each time the socket is back after a drop, never on the first connect. */
	function onReconnected(callback: () => void): () => void {
		reconnectHandlers.add(callback);
		return () => reconnectHandlers.delete(callback);
	}

	return {
		connect,
		disconnect,
		onThreadMessage,
		onReconnected,
	};
}
