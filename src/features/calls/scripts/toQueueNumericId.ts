/**
 * @author Oleksandr Palonnyi
 * the transfer popup keeps a table row id as a string, while the SDK's
 * `blindTransferQueue` / `processTransferQueue` want the queue's numeric id.
 * `Number('')` is 0, so an empty id would otherwise reach the backend as
 * queue 0; only a positive integer is passed on
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export function toQueueNumericId(queueId: string): number | null {
	const queueNumericId = Number(queueId);
	return Number.isInteger(queueNumericId) && queueNumericId > 0
		? queueNumericId
		: null;
}
