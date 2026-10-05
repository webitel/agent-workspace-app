import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { CallDirection } from 'webitel-sdk';

/**
 * Outbound call to a queue that no operator picked up:
 * `bridgedAt` appears only once an operator answers.
 */
export const isUnansweredQueueCall = ({
	direction,
	queue,
	bridgedAt,
}: EngineHistoryCall): boolean =>
	direction === CallDirection.Outbound && !!queue?.id && !bridgedAt;
