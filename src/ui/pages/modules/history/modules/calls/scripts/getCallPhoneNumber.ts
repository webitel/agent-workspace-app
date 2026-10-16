import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { CallDirection } from 'webitel-sdk';

/**
 * Number of the other party: callee for outbound calls, caller for inbound.
 */
export const getCallPhoneNumber = ({
	direction,
	to,
	from,
	destination,
}: EngineHistoryCall): string | undefined =>
	direction === CallDirection.Outbound
		? to?.number || destination
		: from?.number;
