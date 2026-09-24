import type { Call } from 'webitel-sdk';

import { OutboundCallStatus } from '../enums/OutboundCallStatus.enum';

/**
 * @author Oleksandr Palonnyi
 * `answeredAt` is what the SDK's own `talking` getter reads; for an outbound leg
 * it is set on the first `active` event. Whether the platform can mark the
 * agent's leg active before the callee picks up is not verified yet (see
 * docs/claude/calls.md, open questions). US_16.01 AC_16.01.04 folds "declined",
 * "not picked up" and "no connection" into one No answer state, so the hangup
 * cause is deliberately not inspected.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
export function getOutboundCallStatus(
	call: Call | null | undefined,
): OutboundCallStatus {
	if (!call) return OutboundCallStatus.Dialing;

	const isAnswered = call.answeredAt > 0;
	if (call.hangupAt > 0) {
		return isAnswered ? OutboundCallStatus.Ended : OutboundCallStatus.NoAnswer;
	}
	return isAnswered ? OutboundCallStatus.Answered : OutboundCallStatus.Ringing;
}
