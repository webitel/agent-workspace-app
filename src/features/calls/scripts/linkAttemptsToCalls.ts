import { type Call, CallDirection } from 'webitel-sdk';

import type {
	OutboundCallAssignment,
	OutboundCallAttempt,
} from '../types/OutboundCallAttempt.types';
import { hasDialedCallIds, isDialedCall } from './isDialedCall';

/**
 * @author Oleksandr Palonnyi
 * An attempt whose dial returned ids takes only the call those ids name, and a call it took
 * by elimination before they came is swapped for that one: a stuck attempt then never adopts
 * a call dialled elsewhere (desk phone, another tab), which elimination could not rule out.
 * An attempt without ids (its request still open, or an SDK that returns none) is matched by
 * elimination as before (WTEL-WS-13): attempts are served in dialling order and each takes the
 * first outbound call that was not in the list when it dialled and is not already owned.
 * `claimedCallIds` holds calls handed out earlier whose attempt is gone (answered, closed,
 * hung up early), so a later attempt cannot adopt them. Attempts with ids go first, so one
 * without cannot take their call by elimination
 * [WS-155](https://webitel.atlassian.net/browse/WS-155)
 */
export function linkAttemptsToCalls({
	attempts,
	callList,
	claimedCallIds,
}: {
	attempts: OutboundCallAttempt[];
	callList: Call[];
	claimedCallIds: ReadonlySet<string>;
}): OutboundCallAssignment[] {
	const outboundCalls = callList.filter(
		(existingCall) => existingCall.direction === CallDirection.Outbound,
	);
	const ownedCallIds = new Set([
		...claimedCallIds,
		...attempts.flatMap((attempt) =>
			attempt.placedCall
				? [
						attempt.placedCall.id,
					]
				: [],
		),
	]);
	const assignments: OutboundCallAssignment[] = [];

	function assign(attempt: OutboundCallAttempt, call: Call) {
		ownedCallIds.add(call.id);
		assignments.push({
			attemptId: attempt.id,
			call,
		});
	}

	for (const attempt of attempts) {
		if (!hasDialedCallIds(attempt.dialedCallIds)) continue;
		if (
			attempt.placedCall &&
			isDialedCall(attempt.placedCall, attempt.dialedCallIds)
		) {
			continue;
		}

		const dialedCall = outboundCalls.find(
			(existingCall) =>
				!ownedCallIds.has(existingCall.id) &&
				isDialedCall(existingCall, attempt.dialedCallIds),
		);
		if (dialedCall) assign(attempt, dialedCall);
	}

	for (const attempt of attempts) {
		if (attempt.placedCall || hasDialedCallIds(attempt.dialedCallIds)) continue;

		const newOutboundCall = outboundCalls.find(
			(existingCall) =>
				!attempt.callIdsBeforeDial.has(existingCall.id) &&
				!ownedCallIds.has(existingCall.id),
		);
		if (newOutboundCall) assign(attempt, newOutboundCall);
	}

	return assignments;
}
