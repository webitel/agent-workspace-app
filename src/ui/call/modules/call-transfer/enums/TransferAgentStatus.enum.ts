import { AgentStatus } from '@webitel/ui-sdk/enums';

import { UserStatus } from '../../../../../features/user-status/enums/UserStatus';

export const TransferAgentStatus = {
	Online: AgentStatus.ONLINE,
	Pause: AgentStatus.PAUSE,
	BreakOut: AgentStatus.BREAK_OUT,
	Offline: AgentStatus.OFFLINE,
	Dnd: UserStatus.Dnd,
} as const;
export type TransferAgentStatus =
	(typeof TransferAgentStatus)[keyof typeof TransferAgentStatus];
