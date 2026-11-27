import { type Call, CallDirection } from 'webitel-sdk';

import type {
	OutboundCallAssignment,
	OutboundCallAttempt,
} from '../types/OutboundCallAttempt.types';
import { hasDialedCallIds } from './hasDialedCallIds';
import { isDialedCall } from './isDialedCall';
import { isPlacedCallNamedByDial } from './isPlacedCallNamedByDial';

/**
 * @author Oleksandr Palonnyi
 * An attempt without ids (its request still open, an external phone, a failed web phone
 * dial) can only be matched by elimination: attempts are served in dialling order and each
 * takes the first outbound call that was not in the list when it dialled and is not already
 * owned. The claimed sets hold calls handed out earlier whose attempt is gone (answered,
 * closed, hung up early), so a later attempt cannot adopt them. Two outbound calls started
 * elsewhere at the same moment (desk phone, another tab) can be matched to the wrong attempt,
 * an accepted risk.
 * An attempt whose dial returned ids takes only the call those ids name, and never one that
 * was listed before it dialled: a stuck attempt then never adopts a call dialled elsewhere,
 * which elimination could not rule out. Attempts with ids are served first, so an attempt
 * without them cannot take a call another one named. A call held only by elimination is not
 * owned against the ids, whether its attempt is still there (it goes back to Dialing) or
 * already gone (`callIdsClaimedByElimination`): otherwise an attempt whose ids came after
 * another attempt took and closed its call would wait in Dialing next to it for good. A call
 * it took by elimination before the ids came is given up as soon as they name another one,
 * so its card cannot hang up a call that is not its own while its call has not rung yet
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 * [WS-155](https://webitel.atlassian.net/browse/WS-155) [NWS][FE] Відкривати плажку активного дзвінка в розгорнутому стані після прийняття вихідного дзвінка
 */
export function linkAttemptsToCalls({
	attempts,
	callList,
	callIdsClaimedByDial,
	callIdsClaimedByElimination,
}: {
	attempts: OutboundCallAttempt[];
	callList: Call[];
	callIdsClaimedByDial: ReadonlySet<string>;
	callIdsClaimedByElimination: ReadonlySet<string>;
}): OutboundCallAssignment[] {
	const outboundCalls = callList.filter(
		(existingCall) => existingCall.direction === CallDirection.Outbound,
	);
	const callIdsOwnedAgainstIds = new Set([
		...callIdsClaimedByDial,
		...attempts.flatMap((attempt) =>
			attempt.placedCall && isPlacedCallNamedByDial(attempt)
				? [
						attempt.placedCall.id,
					]
				: [],
		),
	]);
	const placedCallByAttemptId = new Map(
		attempts.map((attempt) => [
			attempt.id,
			attempt.placedCall,
		]),
	);
	const assignments = new Map<string, Call | null>();

	function assign(attemptId: string, call: Call | null) {
		placedCallByAttemptId.set(attemptId, call);
		assignments.set(attemptId, call);
	}

	function findAttemptIdHoldingCall(callId: string): string | undefined {
		for (const [attemptId, placedCall] of placedCallByAttemptId) {
			if (placedCall?.id === callId) return attemptId;
		}
		return undefined;
	}

	function isClaimed(callId: string): boolean {
		return (
			callIdsClaimedByDial.has(callId) ||
			callIdsClaimedByElimination.has(callId)
		);
	}

	for (const attempt of attempts) {
		if (!hasDialedCallIds(attempt.dialedCallIds)) continue;
		if (isPlacedCallNamedByDial(attempt)) continue;

		const dialedCall = outboundCalls.find(
			(existingCall) =>
				!attempt.callIdsBeforeDial.has(existingCall.id) &&
				!callIdsOwnedAgainstIds.has(existingCall.id) &&
				isDialedCall(existingCall, attempt.dialedCallIds),
		);
		if (!dialedCall) {
			if (placedCallByAttemptId.get(attempt.id)) {
				assign(attempt.id, null);
			}
			continue;
		}

		const holdingAttemptId = findAttemptIdHoldingCall(dialedCall.id);
		if (holdingAttemptId) assign(holdingAttemptId, null);
		assign(attempt.id, dialedCall);
		callIdsOwnedAgainstIds.add(dialedCall.id);
	}

	for (const attempt of attempts) {
		if (
			placedCallByAttemptId.get(attempt.id) ||
			hasDialedCallIds(attempt.dialedCallIds)
		) {
			continue;
		}

		const newOutboundCall = outboundCalls.find(
			(existingCall) =>
				!attempt.callIdsBeforeDial.has(existingCall.id) &&
				!isClaimed(existingCall.id) &&
				!findAttemptIdHoldingCall(existingCall.id),
		);
		if (newOutboundCall) assign(attempt.id, newOutboundCall);
	}

	return [
		...assignments,
	].map(([attemptId, call]) => ({
		attemptId,
		call,
	}));
}
