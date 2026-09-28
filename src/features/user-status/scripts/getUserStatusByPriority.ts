import { AbstractUserStatus, AgentStatus } from '@webitel/ui-sdk/enums';

import { UserStatus } from '../enums/UserStatus';
import { parseUserStatus } from './parseUserStatus';

// user can have several statuses at once, so the shown one is picked by priority, see WTEL-3798
export const getUserStatusByPriority = ({
	presence,
	agentStatus,
}: {
	presence?: {
		status?: string | null;
	} | null;
	agentStatus?: string | null;
}) => {
	const status = parseUserStatus(presence?.status ?? '');

	if (status[UserStatus.Dnd]) return AbstractUserStatus.DND;
	if (status[UserStatus.Busy]) return AbstractUserStatus.BUSY;

	if (!agentStatus)
		return status[UserStatus.Sip] || status[UserStatus.Web]
			? AbstractUserStatus.ACTIVE
			: AbstractUserStatus.OFFLINE;

	if (agentStatus === AgentStatus.ONLINE) return AbstractUserStatus.ONLINE;
	if (
		agentStatus === AgentStatus.PAUSE ||
		agentStatus === AgentStatus.BREAK_OUT
	)
		return AbstractUserStatus.PAUSE;

	return AbstractUserStatus.OFFLINE;
};
