import type { Call } from 'webitel-sdk';

/**
 * @author Oleksandr Palonnyi
 * connected means the callee or the agent answered (`answeredAt`, the same
 * field the SDK's own `talking` uses) and the call has not ended yet. an
 * offer is not answered and an outbound attempt is not answered until the
 * callee picks up, so neither shows up here
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
export function isActiveCall(call: Call | null | undefined): boolean {
	if (!call) return false;

	return call.answeredAt > 0 && !call.hangupAt;
}
