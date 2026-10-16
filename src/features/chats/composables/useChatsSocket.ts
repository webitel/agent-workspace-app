import {
	ChatsSocketMessage,
	createChatsSocketClient,
	createSocketConfig,
} from '@webitel/chat-web-sdk';
import { shallowRef } from 'vue';

import { serviceConfig } from '../api/chatSdk';
import type { IMessage } from '../types/ChatSession.types';

type ChatsSocketClient = ReturnType<typeof createChatsSocketClient>;

// Module-level singleton: the chats socket is one connection for the whole app,
// covering every open session. Handlers live in a Set so consumers can add/remove
// their own callbacks — the SDK exposes no off(), only onMessage().
const client = shallowRef<ChatsSocketClient | null>(null);
const messageHandlers = new Set<(message: IMessage) => void>();
const reconnectHandlers = new Set<() => void>();

/**
 * The SDK reconnects a dropped socket on its own (backoff 1s to 30s, a timeout
 * per attempt, the token read on every attempt) and keeps retrying a first
 * connect that failed; only `disconnect()` stops it. This only builds the
 * client and hands its events to the app.
 */
export function useChatsSocket() {
	async function connect(): Promise<void> {
		if (client.value) return;

		const socketConfig = createSocketConfig({
			baseUrl: import.meta.env.VITE_CHAT_WEB_SOCKET_URL,
			accessToken: () => localStorage.getItem('access-token') ?? '',
		});

		const socketClient = createChatsSocketClient({
			socketConfig,
			serviceConfig,
			// the workspace only runs in a browser, where a dead network is
			// noticed late by TCP; going offline drops the socket at once
			followBrowserNetwork: true,
		});

		socketClient.onMessage(ChatsSocketMessage.ThreadMessage, (data) => {
			messageHandlers.forEach((handler) => {
				handler(data as IMessage);
			});
		});
		// whatever was written while the socket was down was never pushed
		socketClient.onReconnected(() => {
			reconnectHandlers.forEach((handler) => {
				handler();
			});
		});

		client.value = socketClient;

		try {
			await socketClient.connect();
		} catch (err) {
			// the client stays: the SDK keeps retrying until it is answered
			console.error('Failed to connect chats socket', err);
		}
	}

	function disconnect(): void {
		client.value?.disconnect();
		client.value = null;
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
