import { defineStore } from 'pinia';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';

export const useAgentStore = defineStore('agent', () => {
	const { agent, getAgentSession } = useWebSocketClient();

	const initializeAgent = async () => {
		await getAgentSession();
	};

	const setAgentWaitingStatus = async () => {
		await agent.value?.online(undefined, undefined);
	};

	const setAgentPauseStatus = async (note = '') => {
		await agent.value?.pause(note);
	};

	const agentLogout = async () => {
		await agent.value?.offline();
	};

	return {
		initializeAgent,
		setAgentWaitingStatus,
		setAgentPauseStatus,
		agentLogout,
	};
});
