import type { DialedCallIds } from '../types/DialedCallIds.types';

/**
 * @author Oleksandr Palonnyi
 * Reads what `client.call()` resolved with without trusting its declared type: the installed
 * `webitel-sdk` (26.4.44) declares `Promise<void>`, and the release that returns the ids is
 * not out yet. Anything that is not an object of non-empty strings counts as no ids, so the
 * app keeps working on either release; once the SDK is bumped, the input becomes its
 * `OutboundCallResult` and this stays a plain copy
 * [WS-155](https://webitel.atlassian.net/browse/WS-155)
 */
export function toDialedCallIds(dialResult: unknown): DialedCallIds {
	if (typeof dialResult !== 'object' || dialResult === null) return {};

	const callId = 'callId' in dialResult ? dialResult.callId : undefined;
	const sipId = 'sipId' in dialResult ? dialResult.sipId : undefined;

	return {
		...(typeof callId === 'string' && callId
			? {
					callId,
				}
			: {}),
		...(typeof sipId === 'string' && sipId
			? {
					sipId,
				}
			: {}),
	};
}
