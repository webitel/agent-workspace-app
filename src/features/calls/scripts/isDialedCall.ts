import type { Call } from 'webitel-sdk';

import type { DialedCallIds } from '../types/DialedCallIds.types';

export function hasDialedCallIds(dialedCallIds: DialedCallIds): boolean {
	return Boolean(dialedCallIds.callId || dialedCallIds.sipId);
}

/**
 * @author Oleksandr Palonnyi
 * `call.sipId` is a prefix of the dialled `sipId`, not equal to it: the call carries the SIP
 * Call-ID, while the dial returns the web phone's session id, which is that Call-ID followed
 * by the from-tag (checked live). The SDK's own `callBySipId` matches the same way
 * [WS-155](https://webitel.atlassian.net/browse/WS-155)
 */
export function isDialedCall(
	call: Pick<Call, 'id' | 'sipId'>,
	dialedCallIds: DialedCallIds,
): boolean {
	if (dialedCallIds.callId && call.id === dialedCallIds.callId) return true;

	return Boolean(
		dialedCallIds.sipId &&
			call.sipId &&
			dialedCallIds.sipId.startsWith(call.sipId),
	);
}
