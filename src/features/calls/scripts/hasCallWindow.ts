import type { Call } from 'webitel-sdk';

/**
 * A call has a Call window from the moment it connects for as long as the SDK
 * keeps it. After hangup the SDK keeps a call only while its agent task lives
 * (`callDestroyed`), so an ended call still listed here is in post-processing;
 * a call with no task is dropped at hangup and its window goes with it.
 * An offer or an outbound attempt was never answered, so neither has one.
 * [WS-91](https://webitel.atlassian.net/browse/WS-91)
 */
export function hasCallWindow(call: Call | null | undefined): boolean {
	if (!call) return false;

	return call.answeredAt > 0;
}
