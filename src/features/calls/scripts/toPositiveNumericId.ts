/**
 * @author Oleksandr Palonnyi
 * the transfer popup keeps a table row id as a string, while the SDK's
 * `processTransferAgent`, `blindTransferQueue` and `processTransferQueue` want
 * the agent's or the queue's numeric id. `Number('')` is 0, so an empty id
 * would otherwise reach the backend as id 0; only a positive integer is
 * passed on
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export function toPositiveNumericId(rowId: string): number | null {
	const numericId = Number(rowId);
	return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}
