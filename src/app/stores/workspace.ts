import { defineStore } from 'pinia';
import { useWebSocketClient } from '../api/socket/useWebSocketClient';

export const useWorkspaceStore = defineStore('workspace', () => {
	const { connect } = useWebSocketClient();

	async function initialize() {
		// Establish the single WebSocket session for the whole app here, once.
		// Every other consumer uses getClient() (sync) and the reactive slices,
		// assuming the connection has already been brought up at this point.
		await connect();
	}

	return {
		initialize,
	};
});
