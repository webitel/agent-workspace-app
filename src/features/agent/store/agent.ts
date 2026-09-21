import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Agent } from 'webitel-sdk';
import { PauseNotAllowedError } from 'webitel-sdk';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';

export type ActivityType = {
	id: string | number;
	name: string;
};

type OnlineSkill = NonNullable<Parameters<Agent['online']>[2]>;

const AGENT_REMOVED_ERROR = 'app.agent.login.app_err';

const isAgentRemovedError = (err: unknown): boolean =>
	typeof err === 'object' &&
	err !== null &&
	(
		err as {
			id?: string;
		}
	).id === AGENT_REMOVED_ERROR;

export const useAgentStore = defineStore('agent', () => {
	const { agent, getAgentSession, getClient } = useWebSocketClient();

	const isAgentRemoved = ref(false);

	const agentId = computed(() => agent.value?.agentId);
	const status = computed(() => agent.value?.status);
	const lastStatusChange = computed(() => agent.value?.lastStatusChange);

	/*
	 * The session reply carries the status once; keeping it current needs
	 * `cc_agent_subscribe_status`. Without it the server pushes no agent_status
	 * frames, so the SDK never calls `Agent.setStatus` and the status stays
	 * frozen — even after this app's own writes, which the server acks without
	 * echoing anything back.
	 *
	 * The handler is empty on purpose: the SDK updates the reactive Agent from
	 * the frame before fanning it out, and that is what the UI reads.
	 */
	const initializeAgent = async () => {
		await getAgentSession();
		if (!agent.value) return;

		await getClient().subscribeAgentsStatus(() => {}, {
			agent_id: agent.value.agentId,
		});
	};

	const setAgentWaitingStatus = async (activityType?: ActivityType) => {
		try {
			/*
			 * webitel-sdk types the online skill's id as a number while activity
			 * types arrive with string ids. Cast rather than convert: the value is
			 * forwarded to the wire untouched, as the REST path does.
			 */
			await agent.value?.online(
				undefined,
				undefined,
				activityType as OnlineSkill,
			);
		} catch (err) {
			if (!isAgentRemovedError(err)) throw err;
			isAgentRemoved.value = true;
		}
	};

	/*
	 * `cc_agent_pause` carries one opaque payload, so the cause rides in
	 * `status_payload` next to the agent's comment. Unlike the rest of the
	 * session API, `pause()` resolves with a PauseNotAllowedError rather than
	 * throwing it — hand it back so the caller can show it.
	 */
	const setAgentPauseStatus = async (pauseCause?: {
		cause?: string;
		comment?: string;
	}) => {
		const result = pauseCause?.cause
			? await agent.value?.pause({
					status_payload: pauseCause.cause,
					status_comment: pauseCause.comment,
				})
			: await agent.value?.pause();

		if (result instanceof PauseNotAllowedError) return result;
	};

	const setAgentOfflineStatus = async () => {
		await agent.value?.offline();
	};

	return {
		agentId,
		status,
		lastStatusChange,
		isAgentRemoved,

		initializeAgent,
		setAgentWaitingStatus,
		setAgentPauseStatus,
		setAgentOfflineStatus,
	};
});
