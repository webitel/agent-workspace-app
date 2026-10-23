import type { Call } from 'webitel-sdk';

import type { ActiveCallContent } from '../../../ui/call/modules/call-dock/types/ActiveCallContent.types';
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
export function toActiveCallContent(call: Call): ActiveCallContent {
	const number = call.displayNumber;

	return {
		name: resolveName(call),
		number: call.hideNumber ? maskNumber(number) : number,
		queueName: call.queue?.queue_name || undefined,
		answeredAt: call.answeredAt,
		isHold: call.isHold,
		isMuted: Boolean(call.muted),
		/**
		 * @author Oleksandr Palonnyi
		 * `digits` is filled from the server's `dtmf` event, not from our own
		 * `sendDTMF`, so only confirmed digits show and they stay with the call
		 * when the numpad closes or the agent switches calls (same source as
		 * GET_CURRENT_CALL_DIGITS in cc-workspaces)
		 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
		 */
		dtmfDigits: (call.digits ?? []).join(''),
		isPostProcessingEnabled: Boolean(call.allowReporting),
	};
}
