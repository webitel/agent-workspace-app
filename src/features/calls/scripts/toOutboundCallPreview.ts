import type { Call } from 'webitel-sdk';

import type { OutboundCallPreview } from '../../../ui/dialer/types/OutboundCallPreview.types';

/**
 * @author Oleksandr Palonnyi
 * Until `Ringing` arrives there is no `Call`, so the number the agent typed is
 * all there is to show. Once the call exists the platform's view wins: it may
 * have resolved a contact name (the SDK already blanks `displayName` when it is
 * just the number or "Outbound Call"). `hideContact` fails closed, as for
 * incoming calls.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
export function toOutboundCallPreview(
	destination: string,
	call: Call | null | undefined,
): OutboundCallPreview {
	const number = call?.displayNumber || destination;
	const name =
		call && !call.hideContact ? call.displayName || undefined : undefined;

	return {
		name,
		number,
	};
}
