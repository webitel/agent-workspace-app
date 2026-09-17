import { defineStore } from 'pinia';
import { useAgentStore } from '../../features/agent/store/agent';
import { useCallsStore } from '../../features/calls/store/calls';
import { useChatsStore } from '../../features/chats/store/chats';
import { useGlobalHandlersStore } from '../../features/global-handlers/store/globalHandlers';
import { useUserStatusStore } from '../../features/user-status/store/userStatus';
import { useWebSocketClient } from '../api/socket/composables/useWebSocketClient';

export const useWorkspaceStore = defineStore('workspace', () => {
	const { connect: connectWebSocket } = useWebSocketClient();

	/**
	 * Non-fatal on purpose. A user without an agent (a supervisor or admin
	 * opening this app) would otherwise throw here, and `main.ts` aborts the
	 * whole bootstrap — including router creation — on the first rejection.
	 */
	async function initializeAgentSession() {
		try {
			await useAgentStore().initializeAgent();
		} catch (err) {
			console.warn('[workspace] agent session unavailable', err);
		}
	}

	async function initialize() {
		// Establish the single WebSocket session for the whole app here, once.
		// Every other consumer uses getClient() (sync) and the reactive slices,
		// assuming the connection has already been brought up at this point.
		await connectWebSocket();
		// The task feed is agent-scoped: until the agent session exists the SDK
		// drops every channel event and `allTask()` returns an empty list, so chats
		// (and later job/task channels) see nothing at all. Must precede them.
		await initializeAgentSession();
		// Chats coordinator (task feed + chats socket) needs the app socket up first.
		useChatsStore().initialize();
		useCallsStore().initialize();
		useGlobalHandlersStore().initialize();
		await useUserStatusStore().initialize();
	}

	return {
		initialize,
	};
});
