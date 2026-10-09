import type { Call } from 'webitel-sdk';

import type { ActiveCallPreview } from '../../../ui/dialer/types/ActiveCallPreview.types';
import { maskNumber } from './toCallOfferContent';

/**
 * @author Oleksandr Palonnyi
 * identity follows the offer card: an empty `displayName` means the contact
 * was not identified, and `hideContact` / `hideNumber` fail closed
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
export function toActiveCallPreview(call: Call): ActiveCallPreview {
	const number = call.displayNumber;

	return {
		name: call.hideContact ? undefined : call.displayName || undefined,
		number: call.hideNumber ? maskNumber(number) : number,
		queueName: call.queue?.queue_name || undefined,
		answeredAt: call.answeredAt,
		isHold: call.isHold,
		isMuted: call.muted,
	};
}
