import type { Call } from 'webitel-sdk';

import { isActiveCall } from './isActiveCall';

/**
 * @author Oleksandr Palonnyi
 * the SDK's `allowTransfer` says what the backend permits, but it does not
 * know that an outbound attempt or a call already hung up into
 * post-processing has nobody to hand over, so the call must also be connected;
 * a call on hold qualifies, a consult puts the original there anyway
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export function canTransferCall(call: Call | null | undefined): boolean {
	return isActiveCall(call) && Boolean(call?.allowTransfer);
}
