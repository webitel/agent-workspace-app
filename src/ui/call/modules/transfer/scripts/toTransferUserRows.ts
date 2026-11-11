import type { EngineUserStatus } from '@webitel/api-services/gen/models';

import type { TransferUserRow } from '../types/CallTransfer.types';
import { getTransferAgentStatus } from './getTransferAgentStatus';

/**
 * @author Oleksandr Palonnyi
 * the generated model marks every field optional, `id` included. A row is
 * selected and transferred to by its id, so a user without one is left out
 * rather than shown as a row that cannot be used. `status` on the api model is
 * the user's agent status (absent for a user who is not an agent), so such a
 * user gets no status unless they are in DnD
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export function toTransferUserRows(
	users: EngineUserStatus[],
): TransferUserRow[] {
	return users.flatMap((user) =>
		user.id
			? [
					{
						id: user.id,
						name: user.name ?? '',
						extension: user.extension,
						status: getTransferAgentStatus({
							agentStatus: user.status,
							presenceStatus: user.presence?.status,
						}),
					},
				]
			: [],
	);
}
