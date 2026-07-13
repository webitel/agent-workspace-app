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

		client.value = socketClient;

		try {
			await socketClient.connect();
		} catch (err) {
			console.error('Failed to connect chats socket', err);
			client.value = null;
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

	return {
		connect,
		disconnect,
		onThreadMessage,
	};
}
