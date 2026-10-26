import { eventBus } from '@webitel/ui-sdk/scripts';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, getCurrentScope, ref, watch } from 'vue';
import {
	type Call,
	CallActions,
	DeviceNotAllowPermissionError,
} from 'webitel-sdk';
import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import i18n from '../../../app/locale/i18n';
import { router } from '../../../app/router';
import { useOffersStore } from '../../../ui/notifications/modules/offers/store/offers';
import { OfferKind } from '../../../ui/notifications/modules/offers/types/Offer.types';
import { useCallAudio } from '../composables/useCallAudio';
import { hasCallWindow } from '../scripts/hasCallWindow';
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
	// captured during setup so a watcher started from an action belongs to the
	// store and stops with `$dispose()`
	const storeScope = getCurrentScope();

	const { getClient, calls } = useWebSocketClient();
	const offersStore = useOffersStore();

	const { playRemoteAudio, stopRemoteAudio } = useCallAudio();

	const isOutboundCallRequestPending = ref(false);

	const callIdsWithHoldRequestPending = new Set<string>();

	// Return targets by call id: where the agent was when they accepted each
	// call here. Not reactive — only the call's workspace reads one, once, when
	// the window closes.
	const returnTargets = new Map<string, string>();

	const callList = computed<Call[]>(() => calls.value ?? []);

	const incomingOffers = computed(() =>
		callList.value.filter(isIncomingCallOffer),
	);

	const activeCalls = computed(() => callList.value.filter(isActiveCall));

	// Active calls plus the ended ones still in post-processing (WS-91).
	const windowedCalls = computed(() => callList.value.filter(hasCallWindow));

	const isCallInProgress = computed(() => callList.value.some(isCallAudible));

	// TODO: замінити на реальний підрахунок нових/пропущених дзвінків
	const newCallsCount = computed(() => 3);

	function getCallById(callId: string): Call | undefined {
		return callList.value.find((call) => call.id === callId);
	}

	/**
	 * Resolves `false` when nothing was answered: the call is gone, the mic is
	 * blocked, or the SDK has no line of its own to answer on (no web device).
	 */
	async function answer(callId: string): Promise<boolean> {
		const call = getCallById(callId);
		if (!call?.allowAnswer) return false;

		if (!(await ensureMicrophoneAllowed())) return false;

		await holdOtherLiveCalls(callId);
		return call.answer({
			audio: true,
			disableStun: !getStunEnabled(),
		});
	}

	/**
	 * Accepting an inbound offer here is the one thing that takes the agent to
	 * the call's window by itself; a call connected any other way waits in the
	 * dock (WS-87). Where they were is kept as the call's Return target.
	 */
	async function acceptOffer(callId: string) {
		// a target is only ever taken while its window is open, so one whose call
		// has gone is never going to be
		for (const id of returnTargets.keys()) {
			if (!getCallById(id)) returnTargets.delete(id);
		}

		returnTargets.set(callId, router.currentRoute.value.fullPath);
		if (!(await answer(callId))) {
			returnTargets.delete(callId);
			return;
		}
		openWindowOnceConnected(callId);
	}

	function openWindowOnceConnected(callId: string) {
		const phase = () => {
			const call = getCallById(callId);
			if (!call) return 'gone';
			return hasCallWindow(call) ? 'connected' : 'ringing';
		};

		const settle = (value: ReturnType<typeof phase>) => {
			if (value === 'ringing') return false;
			if (value === 'connected') {
				router.push({
					name: 'call-window',
					params: {
						callId,
					},
				});
			} else {
				returnTargets.delete(callId);
			}
			return true;
		};

		if (settle(phase())) return;
		const register = () =>
			watch(phase, (value) => {
				if (settle(value)) stop?.();
			});
		const stop = storeScope ? storeScope.run(register) : register();
	}

	function takeReturnTarget(callId: string): string | undefined {
		const target = returnTargets.get(callId);
		returnTargets.delete(callId);
		return target;
	}

	/**
	 * @author Oleksandr Palonnyi
	 * the agent talks on one call at a time and the rest wait on hold, as in
	 * cc-workspaces (HOLD_OTHER_CALLS); the SDK does not hold the others when a
	 * call goes live, so every action that makes a call live does it here.
	 * A call that refuses to hold must not block that action: the agent can
	 * still put it on hold by hand, but a call left unanswered is lost
	 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
	 */
	async function holdOtherLiveCalls(exceptCallId?: string) {
		const liveCalls = callList.value.filter(
			(existingCall) =>
				existingCall.id !== exceptCallId &&
				existingCall.active &&
				!existingCall.isHold &&
				existingCall.allowHold,
		);

		try {
			await Promise.all(liveCalls.map((liveCall) => liveCall.hold()));
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

			await holdOtherLiveCalls();
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
			if (call.isHold) await holdOtherLiveCalls(callId);
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
						onAccept: () => acceptOffer(call.id),
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
		windowedCalls,
		newCallsCount,
		isOutboundCallRequestPending,

		initialize,
		getCallById,
		call,
		answer,
		takeReturnTarget,
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
