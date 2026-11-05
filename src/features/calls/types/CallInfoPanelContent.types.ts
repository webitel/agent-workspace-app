import type { CallDirection } from 'webitel-sdk';

/**
 * The call as the right panel's info block shows it (US_13.06). Absent values
 * are `undefined`, so the block hides the line instead of drawing an empty one.
 */
export interface CallInfoPanelContent {
	direction?: CallDirection;
	from?: string;
	to?: string;
	queueName?: string;
	createdAt?: number;
	answeredAt?: number;
}
