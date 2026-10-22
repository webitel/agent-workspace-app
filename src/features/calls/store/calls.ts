import { eventBus } from '@webitel/ui-sdk/scripts';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import {
	type Call,
	CallActions,
	DeviceNotAllowPermissionError,
} from 'webitel-sdk';
import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import i18n from '../../../app/locale/i18n';
import { useOffersStore } from '../../../ui/notifications/modules/offers/store/offers';
import { OfferKind } from '../../../ui/notifications/modules/offers/types/Offer.types';
import { useCallAudio } from '../composables/useCallAudio';
import { isActiveCall } from '../scripts/isActiveCall';
import { isCallAudible } from '../scripts/isCallAudible';
import { isIncomingCallOffer } from '../scripts/isIncomingCallOffer';
import { isMicrophoneAllowed } from '../scripts/mediaPermissions';
import { sanitizeDestination } from '../scripts/sanitizeDestination';
import { toCallOfferContent } from '../scripts/toCallOfferContent';

/**
 * Call feed coordinator.
 *
 * Offers are *derived*, not pushed: `incomingOffers` filters the SDK's reactive
 * call store, so a call leaves the list on every terminal path — answered,
 * hung up, abandoned, redistributed, answered on another device — without us
 * enumerating call actions. The watcher only translates that delta into
 * notifications-module calls.
 */
export const useCallsStore = defineStore('calls', () => {
	const { getClient, calls } = useWebSocketClient();
	const offersStore = useOffersStore();

	const { playRemoteAudio, stopRemoteAudio } = useCallAudio();

	const isOutboundCallRequestPending = ref(false);

	const callIdsWithHoldRequestPending = new Set<string>();

	const callList = computed<Call[]>(() => calls.value ?? []);

	const incomingOffers = computed(() =>
		callList.value.filter(isIncomingCallOffer),
	);

	const activeCalls = computed(() => callList.value.filter(isActiveCall));

	const isCallInProgress = computed(() => callList.value.some(isCallAudible));

	// TODO: замінити на реальний підрахунок нових/пропущених дзвінків
	const newCallsCount = computed(() => 3);

	function getCallById(callId: string): Call | undefined {
		return callList.value.find((call) => call.id === callId);
	}

	async function answer(callId: string) {
		const call = getCallById(callId);
		if (!call?.allowAnswer) return;

		if (!(await ensureMicrophoneAllowed())) return;

		await holdOtherLiveCallsOrNotify(callId);
		await call.answer({
			audio: true,
			disableStun: !getStunEnabled(),
		});
	}

	/**
	 * @author Oleksandr Palonnyi
	 * the agent talks on one call at a time and the rest wait on hold, as in
	 * cc-workspaces (HOLD_OTHER_CALLS); the SDK does not hold the others when a
	 * call goes live, so every action that makes a call live does it here
	 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
	 */
	async function holdOtherLiveCalls(exceptCallId: string | undefined) {
		const liveCalls = callList.value.filter(
			(existingCall) =>
				existingCall.id !== exceptCallId &&
				existingCall.active &&
				!existingCall.isHold &&
				existingCall.allowHold,
		);

		await Promise.all(liveCalls.map((liveCall) => liveCall.hold()));
	}

	/**
	 * @author Oleksandr Palonnyi
	 * answering or resuming must not be blocked by another call that refused to
	 * hold: the agent can still put it on hold by hand, but a call left
	 * unanswered is lost
	 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
	 */
	async function holdOtherLiveCallsOrNotify(exceptCallId: string) {
		try {
			await holdOtherLiveCalls(exceptCallId);
		} catch (err) {
			console.warn('[calls] holding the other calls failed', err);
			notifyCallError('holdToggleFailed');
		}
	}

	async function call({
		destination: rawDestination,
	}: {
		destination: string;
	}): Promise<boolean> {
		const destination = sanitizeDestination(rawDestination);
		/**
		 * @author Oleksandr Palonnyi
		 * The request can stay open for seconds while the browser waits on the
		 * microphone permission prompt, and a second call in that window would dial twice
		 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
		 */
		if (!destination || isOutboundCallRequestPending.value) return false;

		isOutboundCallRequestPending.value = true;
		try {
			if (!(await ensureMicrophoneAllowed())) return false;

			await holdOtherLiveCalls(undefined);
			await getClient().call({
				destination,
				params: {
					disableStun: !getStunEnabled(),
				},
			});
			return true;
		} catch (err) {
			console.error('[calls] outbound call failed', err);
			eventBus.$emit('notification', {
				type: 'error',
				text: i18n.global.t('error.calls.outboundCallFailed'),
			});
			return false;
		} finally {
			isOutboundCallRequestPending.value = false;
		}
	}

	async function hangup(callId: string) {
		const call = getCallById(callId);
		if (!call?.allowHangup) return;

		try {
			await call.hangup();
		} catch (err) {
			console.warn('[calls] hangup failed', err);
		}
	}

	async function toggleMute(callId: string) {
		const call = getCallById(callId);
		if (!call?.allowHangup) return;

		try {
			await call.mute(!call.muted);
		} catch (err) {
			console.warn('[calls] mute toggle failed', err);
		}
	}

	async function toggleHold(callId: string) {
		const call = getCallById(callId);
		/**
		 * @author Oleksandr Palonnyi
		 * the SDK splits the permission: `allowHold` is false once the call is on
		 * hold, and releasing it is gated by `allowUnHold`, so checking only
		 * `allowHold` made a held call impossible to resume
		 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
		 */
		if (!call?.allowHold && !call?.allowUnHold) return;

		/**
		 * @author Oleksandr Palonnyi
		 * `allowHold` / `allowUnHold` only flip once the SDK has applied the
		 * toggle, so a second click while the first request is in flight passes
		 * the check above and would flip the call back or raise a false error
		 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
		 */
		if (callIdsWithHoldRequestPending.has(callId)) return;

		callIdsWithHoldRequestPending.add(callId);
		try {
			if (call.isHold) await holdOtherLiveCallsOrNotify(callId);
			await call.toggleHold();
		} catch (err) {
			console.warn('[calls] hold toggle failed', err);
			notifyCallError('holdToggleFailed');
		} finally {
			callIdsWithHoldRequestPending.delete(callId);
		}
	}

	async function sendDtmf(callId: string, digit: string) {
		const call = getCallById(callId);
		if (!call?.allowDtmf) return;

		try {
			await call.sendDTMF(digit);
		} catch (err) {
			console.warn('[calls] dtmf failed', err);
			notifyCallError('dtmfFailed');
		}
	}

	/**
	 * Diffing by id, not by array identity: the SDK mutates `Call` objects in
	 * place, so unrelated field changes re-run this watcher with the same
	 * instances.
	 */
	function subscribeToOffers() {
		watch(
			incomingOffers,
			(offers) => {
				offersStore.retainOnly(
					OfferKind.Call,
					offers.map((call) => call.id),
				);

				for (const call of offers) {
					offersStore.notify({
						id: call.id,
						// a getter, so the card tracks the live call instead of a snapshot
						content: () => toCallOfferContent(call),
						onAccept: () => answer(call.id),
						onDecline: () => hangup(call.id),
					});
				}
			},
			{
				deep: true,
			},
		);
	}

	/**
	 * Registered before the offers watcher so that, when a feed update brings an
	 * audible call and a new offer at once, the offer already finds the ring muted.
	 * [WS-133](https://webitel.atlassian.net/browse/WS-133)
	 */
	function subscribeToCallInProgress() {
		watch(
			isCallInProgress,
			(inProgress) => offersStore.setCallInProgress(inProgress),
			{
				immediate: true,
			},
		);
	}

	function onCallEvent(action: CallActions, changedCall: Call) {
		switch (action) {
			case CallActions.PeerStream:
				playRemoteAudio(changedCall);
				break;
			case CallActions.Hangup:
			case CallActions.Destroy:
				stopRemoteAudio(changedCall.id);
				break;
		}
	}

	function initialize() {
		const client = getClient();
		client.subscribeCall(onCallEvent, null);

		offersStore.initialize();
		subscribeToCallInProgress();
		subscribeToOffers();
	}

	return {
		callList,
		incomingOffers,
		activeCalls,
		newCallsCount,
		isOutboundCallRequestPending,

		initialize,
		call,
		answer,
		toggleMute,
		toggleHold,
		sendDtmf,
		hangup,
	};
});

function notifyCallError(errorKey: 'holdToggleFailed' | 'dtmfFailed'): void {
	eventBus.$emit('notification', {
		type: 'error',
		text: i18n.global.t(`error.calls.${errorKey}`),
	});
}

async function ensureMicrophoneAllowed(): Promise<boolean> {
	if (await isMicrophoneAllowed()) return true;

	eventBus.$emit('notification', {
		type: 'error',
		text: i18n.global.t(`error.websocket.${DeviceNotAllowPermissionError.id}`),
	});
	return false;
}

function getStunEnabled(): boolean {
	try {
		const config = JSON.parse(localStorage.getItem('CONFIG') ?? '{}') as {
			CLI?: {
				stun?: boolean;
			};
		};
		return config.CLI?.stun ?? true;
	} catch {
		return true;
	}
}

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useCallsStore, import.meta.hot));
}
