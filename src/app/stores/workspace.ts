import { defineStore } from 'pinia';
import { useGlobalHandlersStore } from '../../features/global-handlers/store/globalHandlers';
import { useChatsStore } from '../../features/chats/store/chats';
import { useUserStatusStore } from '../../features/user-status/store/userStatus';
import { useWebSocketClient } from '../api/socket/composables/useWebSocketClient';

export const useWorkspaceStore = defineStore('workspace', () => {
	const { connect: connectWebSocket } = useWebSocketClient();
	const { subscribeToPhoneRegistration } = useGlobalHandlersStore();
	const { subscribeUserStatus } = useUserStatusStore();

	async function initialize() {
		// Establish the single WebSocket session for the whole app here, once.
		// Every other consumer uses getClient() (sync) and the reactive slices,
		// assuming the connection has already been brought up at this point.
		await connectWebSocket();
		// Chats coordinator (task feed + chats socket) needs the app socket up first.
		useChatsStore().initialize();
		subscribeToPhoneRegistration();
		subscribeUserStatus();
	}

	return {
		initialize,
	};
});
