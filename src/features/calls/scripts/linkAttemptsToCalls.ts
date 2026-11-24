import { type Call, CallDirection } from 'webitel-sdk';

import type {
	OutboundCallAssignment,
	OutboundCallAttempt,
} from '../types/OutboundCallAttempt.types';
import { hasDialedCallIds, isDialedCall } from './isDialedCall';

/**
 * @author Oleksandr Palonnyi
 * An attempt whose dial returned ids takes only the call those ids name, and never one that
 * was listed before it dialled: a stuck attempt then never adopts a call dialled elsewhere
 * (desk phone, another tab), which elimination could not rule out. A call it took by
 * elimination before the ids came is given up as soon as they name another one, so its card
 * cannot hang up a call that is not its own while its call has not rung yet.
 * An attempt without ids (its request still open, an external phone, a failed web phone dial)
 * is matched by elimination as before (WTEL-WS-13): attempts are served in dialling order and
 * each takes the first outbound call that was not in the list when it dialled and is not
 * already owned. A call held only by elimination is not owned against the ids: the attempt
 * they name takes it, and the attempt that held it goes back to Dialing.
 * `claimedCallIds` holds calls handed out earlier whose attempt is gone (answered, closed,
 * hung up early), so a later attempt cannot adopt them
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
	const callIdsHeldByElimination = new Set(
		attempts.flatMap((attempt) =>
			attempt.placedCall &&
			!isDialedCall(attempt.placedCall, attempt.dialedCallIds)
				? [
						attempt.placedCall.id,
					]
				: [],
		),
	);
	const ownedCallIds = new Set(
		[
			...claimedCallIds,
			...attempts.flatMap((attempt) =>
				attempt.placedCall
					? [
							attempt.placedCall.id,
						]
					: [],
			),
		].filter((callId) => !callIdsHeldByElimination.has(callId)),
	);
	const placedCallByAttemptId = new Map(
		attempts.map((attempt) => [
			attempt.id,
			attempt.placedCall,
		]),
	);
	const assignments = new Map<string, Call | null>();

	function assign(attemptId: string, call: Call | null) {
		if (call) ownedCallIds.add(call.id);
		placedCallByAttemptId.set(attemptId, call);
		assignments.set(attemptId, call);
	}

	function findAttemptIdHoldingCall(callId: string): string | undefined {
		for (const [attemptId, placedCall] of placedCallByAttemptId) {
			if (placedCall?.id === callId) return attemptId;
		}
		return undefined;
	}

	function isNewUnownedCall(
		attempt: OutboundCallAttempt,
		existingCall: Call,
	): boolean {
		return (
			!attempt.callIdsBeforeDial.has(existingCall.id) &&
			!ownedCallIds.has(existingCall.id)
		);
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
				isNewUnownedCall(attempt, existingCall) &&
				isDialedCall(existingCall, attempt.dialedCallIds),
		);
		if (!dialedCall) {
			if (placedCallByAttemptId.get(attempt.id)) assign(attempt.id, null);
			continue;
		}

		const holdingAttemptId = findAttemptIdHoldingCall(dialedCall.id);
		if (holdingAttemptId) assign(holdingAttemptId, null);
		assign(attempt.id, dialedCall);
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
				isNewUnownedCall(attempt, existingCall) &&
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
