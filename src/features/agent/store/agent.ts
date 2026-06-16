import { defineStore } from 'pinia';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';

export const createUserStore = ({ namespace } = {}) => {
    return defineStore(`${namespace}`, () => {
        const { agent, getAgentSession } = useWebSocketClient();


        const setAgentWaitingStatus = async () => {
            const agentInstance = await getAgentSession();
            agentInstance.online();
        };

        const setAgentPauseStatus = async (note = '') => {
            const agentInstance = await getAgentSession();
            await agentInstance.pause(note);
        };

        const agentLogout = async () => {
            const agentInstance = await getAgentSession();
            agentInstance.offline();
        };

        const setAgentInstance = (value) => {
            agent.value = value;
        };

        return {
            agent,

            setAgentWaitingStatus,
            setAgentPauseStatus,
            agentLogout,

            setAgentInstance,
        };
    });
};
