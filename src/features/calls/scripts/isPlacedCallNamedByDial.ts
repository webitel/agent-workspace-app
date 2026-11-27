import type { OutboundCallAttempt } from '../types/OutboundCallAttempt.types';
import { isDialedCall } from './isDialedCall';

/**
 * @author Oleksandr Palonnyi
 * Only a call the dial named is known to be this tab's. One linked by elimination (an
 * external phone, a failed web phone dial) may be a call dialled on a desk phone or in
 * another tab, so the ids can still take it away, and its answer is not this tab's
 * [WS-155](https://webitel.atlassian.net/browse/WS-155) [NWS][FE] Відкривати плажку активного дзвінка в розгорнутому стані після прийняття вихідного дзвінка
 */
export function isPlacedCallNamedByDial(
	attempt: Pick<OutboundCallAttempt, 'placedCall' | 'dialedCallIds'>,
): boolean {
	return Boolean(
		attempt.placedCall &&
			isDialedCall(attempt.placedCall, attempt.dialedCallIds),
	);
}
