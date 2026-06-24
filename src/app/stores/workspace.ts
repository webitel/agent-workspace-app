import { defineStore } from 'pinia';
import { useClientHandlersStore } from '../../features/client-handlers/store/client-handlers';
import { useWebSocketClient } from '../api/socket/composables/useWebSocketClient';

export const useWorkspaceStore = defineStore('workspace', () => {
	const { connect: connectWebSocket } = useWebSocketClient();
	const { subscribeToPhoneRegistration } = useClientHandlersStore();

	async function initialize() {
		// Establish the single WebSocket session for the whole app here, once.
		// Every other consumer uses getClient() (sync) and the reactive slices,
		// assuming the connection has already been brought up at this point.
		await connectWebSocket();
		subscribeToPhoneRegistration();
	}

	return {
		initialize,
	};
});
