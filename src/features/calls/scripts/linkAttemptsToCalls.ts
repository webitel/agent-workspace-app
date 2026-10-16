import { type Call, CallDirection } from 'webitel-sdk';

import type {
	OutboundCallAssignment,
	OutboundCallAttempt,
} from '../types/OutboundCallAttempt.types';

/**
 * @author Oleksandr Palonnyi
 * `client.call()` returns nothing that identifies the call, so an attempt can
 * only be matched by elimination: attempts are served in dialling order and each
 * takes the first outbound call that was not in the list when it dialled and is
 * not already owned. `claimedCallIds` holds calls handed out earlier whose attempt
 * is gone (answered, closed, hung up early), so a later attempt cannot adopt them.
 * Two outbound calls started elsewhere at the same moment (desk phone, another
 * tab) can be matched to the wrong attempt, an accepted risk
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
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

	for (const attempt of attempts) {
		if (attempt.placedCall) continue;

		const newOutboundCall = callList.find(
			(existingCall) =>
				existingCall.direction === CallDirection.Outbound &&
				!attempt.callIdsBeforeDial.has(existingCall.id) &&
				!ownedCallIds.has(existingCall.id),
		);
		if (!newOutboundCall) continue;

		ownedCallIds.add(newOutboundCall.id);
		assignments.push({
			attemptId: attempt.id,
			call: newOutboundCall,
		});
	}

	return assignments;
}
