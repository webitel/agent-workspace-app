import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, shallowRef, watch } from 'vue';
import type { Call } from 'webitel-sdk';

import { OutboundCallStatus } from '../enums/OutboundCallStatus.enum';
import { getOutboundCallStatus } from '../scripts/getOutboundCallStatus';
import { linkAttemptsToCalls } from '../scripts/linkAttemptsToCalls';
import { toOutboundCallPreview } from '../scripts/toOutboundCallPreview';
import type {
	OutboundCallAttempt,
	OutboundCallAttemptView,
} from '../types/OutboundCallAttempt.types';
import { useCallsStore } from './calls';

/**
 * @author Oleksandr Palonnyi
 * The only call state that cannot be derived from the SDK feed, hence a store of its
 * own next to `calls`: the number as the agent typed it, and the `Call` itself. The
 * SDK removes a call on `Destroy`, but No answer (AC_16.01.04) is shown after exactly
 * that, and the final fields stay readable on the reference kept here. Several
 * attempts can run at once (the agent may dial again before the first one is
 * answered), each owned by its own id because a call has none until `Ringing`
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
export const useOutboundCallAttemptsStore = defineStore(
	'outboundCallAttempts',
	() => {
		const callsStore = useCallsStore();

		const trackedAttempts = shallowRef<OutboundCallAttempt[]>([]);

		let isInitialized = false;
		let attemptsStartedCount = 0;
		const claimedCallIds = new Set<string>();

		/**
		 * @author Oleksandr Palonnyi
		 * An attempt hung up before `Ringing` stays tracked, hidden, until its call
		 * shows up and can be hung up, so it is not part of what the UI sees
		 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
		 */
		const attempts = computed<OutboundCallAttemptView[]>(() =>
			trackedAttempts.value
				.filter((attempt) => !attempt.isHangupRequested)
				.map((attempt) => ({
					id: attempt.id,
					destination: attempt.destination,
					placedCall: attempt.placedCall,
					status: getOutboundCallStatus(attempt.placedCall),
					preview: toOutboundCallPreview(
						attempt.destination,
						attempt.placedCall,
					),
					isMuted: Boolean(attempt.placedCall?.muted),
				})),
		);

		function findAttemptById(
			attemptId: string,
		): OutboundCallAttempt | undefined {
			return trackedAttempts.value.find((attempt) => attempt.id === attemptId);
		}

		function updateAttempt(
			attemptId: string,
			changes: Partial<OutboundCallAttempt>,
		) {
			trackedAttempts.value = trackedAttempts.value.map((attempt) =>
				attempt.id === attemptId
					? {
							...attempt,
							...changes,
						}
					: attempt,
			);
		}

		function clearAttempt(attemptId: string) {
			trackedAttempts.value = trackedAttempts.value.filter(
				(attempt) => attempt.id !== attemptId,
			);
		}

		/**
		 * @author Oleksandr Palonnyi
		 * The attempt is added before the request, not after it succeeds: `Ringing` may
		 * arrive before `callsStore.call` resolves and has to find an attempt to link to
		 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
		 */
		async function start(rawDestination: string) {
			if (callsStore.isOutboundCallRequestPending) return;

			attemptsStartedCount += 1;
			const attempt: OutboundCallAttempt = {
				id: `outbound-attempt-${attemptsStartedCount}`,
				destination: rawDestination,
				placedCall: null,
				callIdsBeforeDial: new Set(
					callsStore.callList.map((existingCall) => existingCall.id),
				),
				isHangupRequested: false,
			};
			trackedAttempts.value = [
				...trackedAttempts.value,
				attempt,
			];

			const isPlaced = await callsStore.call({
				destination: rawDestination,
			});
			if (!isPlaced) clearAttempt(attempt.id);
		}

		/**
		 * @author Oleksandr Palonnyi
		 * The finished attempt is replaced rather than reused, so its stale No answer
		 * is not shown on the new dial
		 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
		 */
		async function retry(attemptId: string) {
			const failedAttempt = attempts.value.find(({ id }) => id === attemptId);
			if (
				failedAttempt?.status !== OutboundCallStatus.NoAnswer ||
				callsStore.isOutboundCallRequestPending
			) {
				return;
			}

			clearAttempt(attemptId);
			await start(failedAttempt.destination);
		}

		/**
		 * @author Oleksandr Palonnyi
		 * Before `Ringing` there is no `Call` to hang up, and with a registered web
		 * phone the SDK swallows `phone.call()` failures (they surface only as an
		 * `error` event), so that `Ringing` may never come. The card therefore closes
		 * immediately, and the hangup is carried out if the call arrives later
		 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
		 */
		async function hangup(attemptId: string) {
			const attempt = findAttemptById(attemptId);
			if (!attempt) return;

			if (!attempt.placedCall) {
				updateAttempt(attemptId, {
					isHangupRequested: true,
				});
				return;
			}

			const callId = attempt.placedCall.id;
			clearAttempt(attemptId);
			await callsStore.hangup(callId);
		}

		async function toggleMute(attemptId: string) {
			const placedCall = findAttemptById(attemptId)?.placedCall;
			if (!placedCall) return;

			await callsStore.toggleMute(placedCall.id);
		}

		function linkPlacedCalls(callList: Call[]) {
			const currentCallIds = new Set(callList.map((call) => call.id));
			for (const claimedCallId of claimedCallIds) {
				if (!currentCallIds.has(claimedCallId)) {
					claimedCallIds.delete(claimedCallId);
				}
			}

			const assignments = linkAttemptsToCalls({
				attempts: trackedAttempts.value,
				callList,
				claimedCallIds,
			});

			for (const { attemptId, call } of assignments) {
				claimedCallIds.add(call.id);

				if (findAttemptById(attemptId)?.isHangupRequested) {
					clearAttempt(attemptId);
					callsStore.hangup(call.id);
					continue;
				}
				updateAttempt(attemptId, {
					placedCall: call,
				});
			}
		}

		function initialize() {
			if (isInitialized) return;
			isInitialized = true;

			/**
			 * @author Oleksandr Palonnyi
			 * `callsStore.call` returns no call id, and the `Call` reaches `callList` only
			 * later (on `Ringing`), at an unknown moment. Each list change is therefore
			 * checked for a new outbound call to attach to an attempt that has none yet
			 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
			 */
			watch(() => callsStore.callList, linkPlacedCalls);

			/**
			 * @author Oleksandr Palonnyi
			 * An answered call belongs to the active call window (AC_16.01.06), so the attempt
			 * only closes and leaves the call itself running
			 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
			 */
			watch(attempts, (currentAttempts) => {
				for (const { id, status } of currentAttempts) {
					if (status === OutboundCallStatus.Answered) clearAttempt(id);
				}
			});
		}

		return {
			attempts,

			initialize,
			start,
			retry,
			toggleMute,
			hangup,
			clearAttempt,
		};
	},
);

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useOutboundCallAttemptsStore, import.meta.hot),
	);
}
