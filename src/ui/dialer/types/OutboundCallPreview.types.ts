/**
 * @author Oleksandr Palonnyi
 * What the outbound call card shows, independent of `webitel-sdk`: the calls
 * domain maps its `Call` onto this, so the dialer UI never reads SDK objects.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
export interface OutboundCallPreview {
	name?: string;
	number: string;
}
