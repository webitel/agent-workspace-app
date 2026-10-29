import type {
	TransferAgentRow,
	TransferAgentSource,
} from '../types/CallTransfer.types';
import { getTransferAgentStatus } from './getTransferAgentStatus';

export function toTransferAgentRow(
	agent: TransferAgentSource,
): TransferAgentRow {
	return {
		id: agent.id,
		name: agent.name ?? '',
		teamName: agent.team?.name,
		status: getTransferAgentStatus({
			agentStatus: agent.status,
			presenceStatus: agent.userPresenceStatus?.status,
		}),
	};
}
