import { defineStore } from 'pinia';
import { computed } from 'vue';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';

export const useAgentStore = defineStore('agent', () => {
	const { agent, getAgentSession, getClient } = useWebSocketClient();

	const agentId = computed(() => agent.value?.agentId);
	const status = computed(() => agent.value?.status);
	const lastStatusChange = computed(() => agent.value?.lastStatusChange);

	/*
	 * Status is written over REST, by the SDK's status select, but read here off
	 * the websocket session — the server confirms every change with an
	 * agent_status frame. That frame only arrives for subscribers: without
	 * cc_agent_subscribe_status the status stays frozen at whatever the session
	 * opened with, including after this app's own writes.
	 *
	 * The handler is empty on purpose. The SDK updates the reactive Agent from
	 * the frame before fanning it out, and that object is what the UI reads.
	 */
	const initializeAgent = async () => {
		await getAgentSession();
		if (!agent.value) return;

		await getClient().subscribeAgentsStatus(() => {}, {
			agent_id: agent.value.agentId,
		});
	};

	return {
		agentId,
		status,
		lastStatusChange,

		initializeAgent,
	};
});
