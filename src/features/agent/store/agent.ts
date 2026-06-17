import { defineStore } from 'pinia';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';

export const useAgentStore = defineStore('agent', () => {
    const { agent, getAgentSession } = useWebSocketClient();

    const initializeAgent = async () => {
        await getAgentSession();
    }

    const setAgentWaitingStatus = async () => {
        agent.online();
    };

    const setAgentPauseStatus = async (note = '') => {
        agent.pause(note);
    };

    const agentLogout = async () => {
        agent.offline();
    };

    return {
        initializeAgent,
        setAgentWaitingStatus,
        setAgentPauseStatus,
        agentLogout,
    }
});
