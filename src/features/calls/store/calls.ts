import { eventBus } from '@webitel/ui-sdk/scripts';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, watch } from 'vue';
import { type Call, DeviceNotAllowPermissionError } from 'webitel-sdk';
import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import i18n from '../../../app/locale/i18n';
import { useOffersStore } from '../../../ui/notifications/modules/offers/store/offers';
import { OfferKind } from '../../../ui/notifications/modules/offers/types/Offer.types';
import { isIncomingCallOffer } from '../scripts/isIncomingCallOffer';
import { isMicrophoneAllowed } from '../scripts/mediaPermissions';
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

	const callList = computed<Call[]>(() => calls.value ?? []);

	const incomingOffers = computed(() =>
		callList.value.filter(isIncomingCallOffer),
	);

	function getCallById(callId: string): Call | undefined {
		return callList.value.find((call) => call.id === callId);
	}

	async function answer(callId: string) {
		const call = getCallById(callId);
		if (!call?.allowAnswer) return;

		// A denied mic still produces a *connected* call the customer hears
		// nothing on, which is invisible from the agent's side — gate on it.
		if (!(await isMicrophoneAllowed())) {
			eventBus.$emit('notification', {
				type: 'error',
				text: i18n.global.t(
					`error.websocket.${DeviceNotAllowPermissionError.id}`,
				),
			});
			return;
		}

		await call.answer({
			audio: true,
			disableStun: !getStunEnabled(),
		});
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

	function initialize() {
		const client = getClient();
		// the SDK needs a subscriber before it will populate its call store
		client.subscribeCall(() => {}, null);

		offersStore.initialize();
		subscribeToOffers();
	}

	return {
		callList,
		incomingOffers,

		initialize,
		answer,
		hangup,
	};
});

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
