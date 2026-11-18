import { useWebSocketClient } from '../../../../../../../app/api/socket/composables/useWebSocketClient';

/**
 * Asks the queue to call an offline member on one of its communications, as
 * cc-workspaces does. Not a manual dial: the call stays the queue's, and the
 * member leaves the offline queue.
 */
export async function callOfflineMember(
	memberId: number,
	communicationId: number,
): Promise<void> {
	const { agent } = useWebSocketClient();

	// no agent session: there is no queue to ask
	if (!agent.value) return;

	await agent.value.directMember(memberId, communicationId);
}
