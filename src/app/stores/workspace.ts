import { defineStore } from 'pinia';
import { useChatsStore } from '../../features/chats/store/chats';
import { useCallsStore } from '../../features/calls/store/calls';
import { useChatsStore } from '../../features/chats/store/chats';
import { useGlobalHandlersStore } from '../../features/global-handlers/store/globalHandlers';
import { useUserStatusStore } from '../../features/user-status/store/userStatus';
import { useConnectionQualityStore } from '../../ui/header/modules/connectionQuality/store/connectionQuality';
import { useWebSocketClient } from '../api/socket/composables/useWebSocketClient';

export const useWorkspaceStore = defineStore('workspace', () => {
	const { connect: connectWebSocket } = useWebSocketClient();

	async function initialize() {
		// Establish the single WebSocket session for the whole app here, once.
		// Every other consumer uses getClient() (sync) and the reactive slices,
		// assuming the connection has already been brought up at this point.
		await connectWebSocket();
		// Chats coordinator (task feed + chats socket) needs the app socket up first.
		useChatsStore().initialize();
		useCallsStore().initialize();
		useGlobalHandlersStore().initialize();
		useConnectionQualityStore().initialize();
		await useUserStatusStore().initialize();
	}

	return {
		initialize,
	};
});
