import { TransferAgentStatus } from '../enums/TransferAgentStatus.enum';

const DND_PRESENCE_STATUS = 'dnd';

const AGENT_STATUSES: readonly string[] = [
	TransferAgentStatus.Online,
	TransferAgentStatus.Pause,
	TransferAgentStatus.BreakOut,
	TransferAgentStatus.Offline,
];

/**
 * @author Oleksandr Palonnyi
 * an agent can be Online and DnD at once (the two statuses are unrelated), and
 * a DnD agent is not someone to transfer a call to, so DnD wins. A status the
 * list does not know is left absent rather than shown as another one. The
 * channel states of AC_13.07.04 (Busy, Offering, Waiting and the rest) are not
 * mapped yet, their mapping to the indicators is not settled
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export function getTransferAgentStatus({
	agentStatus,
	presenceStatus,
}: {
	agentStatus?: string;
	presenceStatus?: string;
}): TransferAgentStatus | undefined {
	if (presenceStatus === DND_PRESENCE_STATUS) return TransferAgentStatus.Dnd;

	return AGENT_STATUSES.find((status) => status === agentStatus) as
		| TransferAgentStatus
		| undefined;
}
