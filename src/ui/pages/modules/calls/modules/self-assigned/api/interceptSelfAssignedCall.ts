import { useWebSocketClient } from '../../../../../../../app/api/socket/composables/useWebSocketClient';

/**
 * Takes a self-assigned call from its queue for this agent (AC_12.03.02), as
 * cc-workspaces does. Not a manual dial: the client's own waiting call is the
 * one answered, and it leaves the list for every agent. Nothing answers it
 * here: the platform sends the intercepted call with `autoAnswer` and the SDK
 * answers it by itself (ADR-0015)
 * [WS-39](https://webitel.atlassian.net/browse/WS-39)
 */
export async function interceptSelfAssignedCall(
	attemptId: number,
): Promise<void> {
	const { agent } = useWebSocketClient();

	// no agent session: there is no queue to ask
	if (!agent.value) return;

	await agent.value.interceptAttempt(attemptId);
}
