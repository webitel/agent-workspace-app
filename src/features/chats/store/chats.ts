import { acceptHMRUpdate, defineStore } from 'pinia';
import type { Client } from 'webitel-sdk';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';

export const useChatsStore = defineStore('chats', () => {
	let client: Client;

	function subscribeToChats() {
		client.subscribeTask(() => {});
	}

	function initialize() {
		const webSocketClient = useWebSocketClient();
		// connection is established once in the workspace store; here we just
		// grab the already-connected singleton synchronously
		client = webSocketClient.getClient();
		subscribeToChats();
	}

	return {
		initialize,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatsStore, import.meta.hot));
}
