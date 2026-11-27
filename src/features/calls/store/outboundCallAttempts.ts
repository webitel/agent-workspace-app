import { createEventHook } from '@vueuse/core';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, shallowRef, watch } from 'vue';
import type { Call } from 'webitel-sdk';

import { OutboundCallStatus } from '../enums/OutboundCallStatus.enum';
import { getOutboundCallStatus } from '../scripts/getOutboundCallStatus';
import { isPlacedCallNamedByDial } from '../scripts/isPlacedCallNamedByDial';
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

		/**
		 * @author Oleksandr Palonnyi
		 * The attempt is cleared the moment it is answered, so a UI that watches
		 * `attempts` can miss that moment. The hook hands over the id of the answered
		 * call instead, for UI that must react only to a call the agent dialled here,
		 * not to one answered on a desk phone or in another tab
		 * [WS-155](https://webitel.atlassian.net/browse/WS-155) [NWS][FE] Відкривати плажку активного дзвінка в розгорнутому стані після прийняття вихідного дзвінка
		 */
		const answeredHook = createEventHook<string>();

		let isInitialized = false;
		let attemptsStartedCount = 0;
		const callIdsClaimedByDial = new Set<string>();
		const callIdsClaimedByElimination = new Set<string>();

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

		/**
		 * @author Oleksandr Palonnyi
		 * A call is claimed when its attempt goes, not when it is linked: while the attempt
		 * is tracked, its `placedCall` already says whose the call is. The claim remembers
		 * how the call was linked, as the ids of another attempt may still take a call
		 * claimed by elimination only
		 * [WS-155](https://webitel.atlassian.net/browse/WS-155) [NWS][FE] Відкривати плажку активного дзвінка в розгорнутому стані після прийняття вихідного дзвінка
		 */
		function clearAttempt(attemptId: string) {
			const clearedAttempt = findAttemptById(attemptId);
			if (clearedAttempt?.placedCall) {
				const claimedCallIds = isPlacedCallNamedByDial(clearedAttempt)
					? callIdsClaimedByDial
					: callIdsClaimedByElimination;
				claimedCallIds.add(clearedAttempt.placedCall.id);
			}

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
				dialedCallIds: {},
				isHangupRequested: false,
			};
			trackedAttempts.value = [
				...trackedAttempts.value,
				attempt,
			];

			const dialedCallIds = await callsStore.call({
				destination: rawDestination,
			});
			if (!dialedCallIds) {
				clearAttempt(attempt.id);
				return;
			}

			updateAttempt(attempt.id, {
				dialedCallIds,
			});
			/**
			 * @author Oleksandr Palonnyi
			 * The call list may not change again before the call rings, or at all when the
			 * call already rang during the request, so the ids are matched against it now
			 * [WS-155](https://webitel.atlassian.net/browse/WS-155) [NWS][FE] Відкривати плажку активного дзвінка в розгорнутому стані після прийняття вихідного дзвінка
			 */
			linkPlacedCalls(callsStore.callList);
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
			for (const claimedCallIds of [
				callIdsClaimedByDial,
				callIdsClaimedByElimination,
			]) {
				for (const claimedCallId of claimedCallIds) {
					if (!currentCallIds.has(claimedCallId)) {
						claimedCallIds.delete(claimedCallId);
					}
				}
			}

			const assignments = linkAttemptsToCalls({
				attempts: trackedAttempts.value,
				callList,
				callIdsClaimedByDial,
				callIdsClaimedByElimination,
			});

			for (const { attemptId, call } of assignments) {
				updateAttempt(attemptId, {
					placedCall: call,
				});
				if (call && findAttemptById(attemptId)?.isHangupRequested) {
					clearAttempt(attemptId);
					callsStore.hangup(call.id);
				}
			}
		}

		function initialize() {
			if (isInitialized) return;
			isInitialized = true;

			/**
			 * @author Oleksandr Palonnyi
			 * The `Call` reaches `callList` only later (on `Ringing`), at an unknown moment,
			 * so each list change is checked for the call of an attempt that has none yet.
			 * The list is enough: the SDK sets a call's `id` and `sipId` only when it
			 * creates the call (`webitel-sdk` 26.4.45)
			 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
			 * [WS-155](https://webitel.atlassian.net/browse/WS-155) [NWS][FE] Відкривати плажку активного дзвінка в розгорнутому стані після прийняття вихідного дзвінка
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
					if (status !== OutboundCallStatus.Answered) continue;

					const answeredAttempt = findAttemptById(id);
					clearAttempt(id);
					if (
						answeredAttempt?.placedCall &&
						isPlacedCallNamedByDial(answeredAttempt)
					) {
						answeredHook.trigger(answeredAttempt.placedCall.id);
					}
				}
			});
		}

		return {
			attempts,

			onAttemptAnswered: answeredHook.on,
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
