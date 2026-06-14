import { acceptHMRUpdate, defineStore } from 'pinia';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';

export const useChatsStore = defineStore('chats', () => {
	function initialize() {
		// Connection is established once in the workspace store; here we grab the
		// already-connected singleton and subscribe through the SDK's public API.
		const { getClient } = useWebSocketClient();
		getClient().subscribeTask(() => {});
	}

	return {
		initialize,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatsStore, import.meta.hot));
}
