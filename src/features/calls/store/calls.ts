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
import { isIncomingCallOffer } from '../scripts/isIncomingCallOffer';
import { isMicrophoneAllowed } from '../scripts/mediaPermissions';
import { sanitizeDestination } from '../scripts/sanitizeDestination';
import { toIncomingCallPreview } from '../scripts/toIncomingCallPreview';

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

	const callList = computed<Call[]>(() => calls.value ?? []);

	const incomingOffers = computed(() =>
		callList.value.filter(isIncomingCallOffer),
	);

	// TODO: замінити на реальний підрахунок нових/пропущених дзвінків
	const newCallsCount = computed(() => 3);

	function getCallById(callId: string): Call | undefined {
		return callList.value.find((call) => call.id === callId);
	}

	async function answer(callId: string) {
		const call = getCallById(callId);
		if (!call?.allowAnswer) return;

		if (!(await ensureMicrophoneAllowed())) return;

		await call.answer({
			audio: true,
			disableStun: !getStunEnabled(),
		});
	}

	async function holdActiveCall() {
		const activeCall = callList.value.find(
			(existingCall) => existingCall.active && !existingCall.isHold,
		);
		if (!activeCall?.allowHold) return;

		await activeCall.hold();
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

			await holdActiveCall();
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
						preview: () => toIncomingCallPreview(call),
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
		subscribeToOffers();
	}

	return {
		callList,
		incomingOffers,
		newCallsCount,
		isOutboundCallRequestPending,

		initialize,
		call,
		answer,
		toggleMute,
		hangup,
	};
});

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
