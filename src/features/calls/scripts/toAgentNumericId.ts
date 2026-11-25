/**
 * @author Oleksandr Palonnyi
 * the transfer popup keeps a table row id as a string, while the SDK's
 * `processTransferAgent` wants the agent's numeric id; anything that is not an
 * integer must not reach it
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export function toAgentNumericId(agentId: string): number | null {
	const agentNumericId = Number(agentId);
	return Number.isInteger(agentNumericId) ? agentNumericId : null;
}
