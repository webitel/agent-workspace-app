import { AgentStatus } from '@webitel/ui-sdk/enums';

import { UserStatus } from '../../../../../features/user-status/enums/UserStatus';
import { parseUserStatus } from '../../../../../features/user-status/scripts/parseUserStatus';
import { TransferAgentStatus } from '../enums/TransferAgentStatus.enum';

type KnownAgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus];

const KNOWN_AGENT_STATUSES: readonly string[] = Object.values(AgentStatus);

function isKnownAgentStatus(status?: string): status is KnownAgentStatus {
	return !!status && KNOWN_AGENT_STATUSES.includes(status);
}

/**
 * @author Oleksandr Palonnyi
 * an agent can be Online and DnD at once (the two statuses are unrelated), and
 * a DnD agent is not someone to transfer a call to, so DnD wins. The presence
 * arrives as a combined value (`sip,dnd`), hence parseUserStatus rather than a
 * comparison. A status the list does not know is left absent rather than shown
 * as another one. The channel states of AC_13.07.04 (Busy, Offering, Waiting
 * and the rest) are not mapped yet, their mapping to the indicators is not
 * settled
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export function getTransferAgentStatus({
	agentStatus,
	presenceStatus,
}: {
	agentStatus?: string;
	presenceStatus?: string;
}): TransferAgentStatus | undefined {
	if (parseUserStatus(presenceStatus ?? '')[UserStatus.Dnd])
		return TransferAgentStatus.Dnd;

	return isKnownAgentStatus(agentStatus) ? agentStatus : undefined;
}
