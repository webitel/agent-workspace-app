import { type Call, CallDirection } from 'webitel-sdk';

import { isActiveCall } from './isActiveCall';
import { isIncomingCallOffer } from './isIncomingCallOffer';

/**
 * Whether the agent hears this call right now: it is connected and not on hold,
 * or it is the agent's own dial ringing back. While one is, offer sounds stay
 * silent so they don't play over the conversation.
 *
 * An outbound leg that is still an offer is excluded: on preview-dialer and
 * no-auto-answer flows the platform rings the agent's device first, and that
 * ring is ours to play.
 * [WS-133](https://webitel.atlassian.net/browse/WS-133)
 */
export function isCallAudible(call: Call | null | undefined): boolean {
	if (!call || call.hangupAt || call.isHold) return false;
	if (isActiveCall(call)) return true;

	return (
		call.direction === CallDirection.Outbound && !isIncomingCallOffer(call)
	);
}
