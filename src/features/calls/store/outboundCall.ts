import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, shallowRef, watch } from 'vue';
import { type Call, CallDirection } from 'webitel-sdk';

import type { OutboundCallPreview } from '../../../ui/dialer/types/OutboundCallPreview.types';
import { OutboundCallStatus } from '../enums/OutboundCallStatus.enum';
import { getOutboundCallStatus } from '../scripts/getOutboundCallStatus';
import { toOutboundCallPreview } from '../scripts/toOutboundCallPreview';
import { useCallsStore } from './calls';

/**
 * @author Oleksandr Palonnyi
 * The agent's current dialling attempt (US_16.01). It has to outlive the SDK
 * call: the SDK drops a `Call` from its store on `Destroy`, but the No answer
 * state (AC_16.01.04) is shown after exactly that. So the attempt keeps a
 * reference to its `Call`, whose final fields stay readable after removal.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
export const useOutboundCallStore = defineStore('outboundCall', () => {
	const callsStore = useCallsStore();

	const destination = ref<string | null>(null);
	const placedCall = shallowRef<Call | null>(null);

	let isInitialized = false;

	/**
	 * @author Oleksandr Palonnyi
	 * Bookkeeping for a dial whose `Call` hasn't shown up yet, kept apart from the
	 * card state: hanging up before `Ringing` closes the card at once, but the
	 * call may still arrive afterwards and must then be hung up, not adopted.
	 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
	 */
	let pendingDial: {
		callIdsBeforeDial: Set<string>;
		isHangupRequested: boolean;
	} | null = null;

	const hasAttempt = computed(() => destination.value !== null);

	const status = computed<OutboundCallStatus | null>(() =>
		hasAttempt.value ? getOutboundCallStatus(placedCall.value) : null,
	);

	const preview = computed<OutboundCallPreview | null>(() =>
		destination.value === null
			? null
			: toOutboundCallPreview(destination.value, placedCall.value),
	);

	const isMuted = computed(() => Boolean(placedCall.value?.muted));

	async function toggleMute() {
		if (!placedCall.value) return;
		await callsStore.toggleMute(placedCall.value.id);
	}

	function dismiss() {
		destination.value = null;
		placedCall.value = null;
		pendingDial = null;
	}

	async function dial(rawDestination: string) {
		if (callsStore.isDialing) return;

		dismiss();
		destination.value = rawDestination;
		const currentDial = {
			callIdsBeforeDial: new Set(
				callsStore.callList.map((existingCall) => existingCall.id),
			),
			isHangupRequested: false,
		};
		pendingDial = currentDial;

		const isPlaced = await callsStore.call(rawDestination);
		if (!isPlaced && pendingDial === currentDial) dismiss();
	}

	async function retry() {
		if (status.value !== OutboundCallStatus.NoAnswer || !destination.value) {
			return;
		}
		await dial(destination.value);
	}

	/**
	 * @author Oleksandr Palonnyi
	 * Before `Ringing` there is no `Call` to hang up, and with a registered web
	 * phone the SDK swallows `phone.call()` failures (they surface only as an
	 * `error` event), so that `Ringing` may never come. The card therefore closes
	 * immediately, and the hangup is carried out if the call arrives later.
	 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
	 */
	async function hangup() {
		if (!placedCall.value) {
			const unlinkedDial = pendingDial;
			dismiss();
			if (unlinkedDial) {
				unlinkedDial.isHangupRequested = true;
				pendingDial = unlinkedDial;
			}
			return;
		}
		const callId = placedCall.value.id;
		dismiss();
		await callsStore.hangup(callId);
	}

	/**
	 * @author Oleksandr Palonnyi
	 * `client.call()` returns nothing to identify the call, and `Ringing` may
	 * arrive before the request even resolves. The first outbound call that was
	 * not in the list when dialling started is ours.
	 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
	 */
	function linkPlacedCall(calls: Call[]) {
		if (!pendingDial) return;
		const { callIdsBeforeDial, isHangupRequested } = pendingDial;

		const newOutboundCall = calls.find(
			(existingCall) =>
				existingCall.direction === CallDirection.Outbound &&
				!callIdsBeforeDial.has(existingCall.id),
		);
		if (!newOutboundCall) return;

		pendingDial = null;
		if (isHangupRequested) {
			callsStore.hangup(newOutboundCall.id);
			return;
		}
		placedCall.value = newOutboundCall;
	}

	function initialize() {
		if (isInitialized) return;
		isInitialized = true;

		watch(() => callsStore.callList, linkPlacedCall);

		/**
		 * @author Oleksandr Palonnyi
		 * An answered call that ended leaves nothing to show; an unanswered one
		 * stays as No answer until the agent retries or dismisses it.
		 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
		 */
		watch(status, (currentStatus) => {
			if (currentStatus === OutboundCallStatus.Ended) dismiss();
		});
	}

	return {
		destination,
		placedCall,
		status,
		preview,
		isMuted,

		initialize,
		dial,
		retry,
		toggleMute,
		hangup,
		dismiss,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useOutboundCallStore, import.meta.hot),
	);
}
