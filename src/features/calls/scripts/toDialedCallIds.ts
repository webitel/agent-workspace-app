import type { OutboundCallResult } from 'webitel-sdk';

import type { DialedCallIds } from '../types/DialedCallIds.types';

/**
 * @author Oleksandr Palonnyi
 * The SDK resolves `undefined` for an external phone and for a web phone dial that failed
 * (the failure surfaces only as an `error` event), so both count as a dial with no ids
 * [WS-155](https://webitel.atlassian.net/browse/WS-155)
 */
export function toDialedCallIds(
	dialResult: OutboundCallResult | undefined,
): DialedCallIds {
	if (dialResult?.callId) {
		return {
			callId: dialResult.callId,
		};
	}
	if (dialResult?.sipId) {
		return {
			sipId: dialResult.sipId,
		};
	}
	return {};
}
