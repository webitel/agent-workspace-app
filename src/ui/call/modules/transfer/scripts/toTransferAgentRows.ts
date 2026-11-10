import type { EngineAgent } from '@webitel/api-services/gen/models';

import type { TransferAgentRow } from '../types/CallTransfer.types';
import { getTransferAgentStatus } from './getTransferAgentStatus';

/**
 * @author Oleksandr Palonnyi
 * the generated model marks every field optional, `id` included. A row is
 * selected and transferred to by its id, so an agent without one is left out
 * rather than shown as a row that cannot be used
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export function toTransferAgentRows(agents: EngineAgent[]): TransferAgentRow[] {
	return agents.flatMap((agent) =>
		agent.id
			? [
					{
						id: agent.id,
						name: agent.name ?? '',
						teamName: agent.team?.name,
						status: getTransferAgentStatus({
							agentStatus: agent.status,
							presenceStatus: agent.userPresenceStatus?.status,
						}),
					},
				]
			: [],
	);
}
