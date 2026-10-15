import type { Call } from 'webitel-sdk';

/**
 * @author Oleksandr Palonnyi
 * temporary stub for visual tests and checking the call logic: after the
 * callee connects, `answeredAt` stays 0 and the ringing card never turns into
 * the active call bar, so `bridgedAt` is accepted as the connect time too
 * remove it once the real cause is found and switch the callers back to
 * `call.answeredAt`
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
export function getConnectedAt(call: Call): number {
	return call.answeredAt || call.bridgedAt;
}
