import type { CallDirection } from 'webitel-sdk';

/**
 * The call as the right panel's info block shows it (US_13.06). Absent values
 * are `undefined`, so the block hides the row instead of drawing an empty one.
 */
export interface CallPanelInfo {
	direction?: CallDirection;
	from?: string;
	to?: string;
	queueName?: string;
	createdAt?: number;
	answeredAt?: number;
}
