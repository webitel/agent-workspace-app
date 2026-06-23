import { defineStore } from 'pinia';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';

export const useAgentStore = defineStore('agent', () => {
	const { agent, getAgentSession } = useWebSocketClient();

	const initializeAgent = async () => {
		await getAgentSession();
	};

	const setAgentWaitingStatus = async () => {
		await agent.online();
	};

	const setAgentPauseStatus = async (note = '') => {
		await agent.pause(note);
	};

	const setAgentOfflineStatus = async () => {
		await agent.offline();
	};

	return {
		initializeAgent,
		setAgentWaitingStatus,
		setAgentPauseStatus,
		setAgentOfflineStatus,
	};
});
