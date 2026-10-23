import type { Call } from 'webitel-sdk';

import type { ActiveCallPreview } from '../../../ui/call/types/ActiveCallPreview.types';
import { maskNumber } from './toCallOfferContent';

function resolveName(call: Call): string | undefined {
	if (call.hideContact) return undefined;
	return call.displayName || undefined;
}

/**
 * @author Oleksandr Palonnyi
 * identity follows the offer card: an empty `displayName` means the contact
 * was not identified, and `hideContact` / `hideNumber` fail closed
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
export function toActiveCallPreview(call: Call): ActiveCallPreview {
	const number = call.displayNumber;

	return {
		name: resolveName(call),
		number: call.hideNumber ? maskNumber(number) : number,
		queueName: call.queue?.queue_name || undefined,
		answeredAt: call.answeredAt,
		isHold: call.isHold,
		isMuted: Boolean(call.muted),
		isPostProcessingEnabled: Boolean(call.allowReporting),
	};
}
