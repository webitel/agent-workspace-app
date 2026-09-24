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
import { useIncomingInteractionsStore } from '../../../ui/notifications/incoming/store/incomingInteractions';
import { InteractionKind } from '../../../ui/notifications/types/IncomingInteraction.types';
import { useCallAudio } from '../composables/useCallAudio';
import { isIncomingCallOffer } from '../scripts/isIncomingCallOffer';
import { isMicrophoneAllowed } from '../scripts/mediaPermissions';
import { toDialableDestination } from '../scripts/toDialableDestination';
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
	const incomingInteractions = useIncomingInteractionsStore();
	const { playRemoteAudio, stopRemoteAudio } = useCallAudio();

	const isDialing = ref(false);

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

		if (!(await ensureMicrophoneAllowed())) return;

		await call.answer({
			audio: true,
			disableStun: !getStunEnabled(),
		});
	}

	/**
	 * @author Oleksandr Palonnyi
	 * The agent's mic is shared by every leg, so the party already on the line
	 * would otherwise hear the new call being dialled (as in cc-workspaces `CALL`).
	 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
	 */
	async function holdActiveCall() {
		const activeCall = callList.value.find(
			(existingCall) => existingCall.active && !existingCall.isHold,
		);
		if (!activeCall?.allowHold) return;

		await activeCall.hold();
	}

	/**
	 * @author Oleksandr Palonnyi
	 * Resolves to whether the platform accepted the request; the `Call` itself
	 * arrives later through the call feed (`Ringing`), which is why nothing is
	 * written to state here. Every refusal is already reported to the agent.
	 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
	 */
	async function call(rawDestination: string): Promise<boolean> {
		const destination = toDialableDestination(rawDestination);
		/**
		 * @author Oleksandr Palonnyi
		 * A second click while the first request is in flight would dial twice.
		 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
		 */
		if (!destination || isDialing.value) return false;

		isDialing.value = true;
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
			isDialing.value = false;
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
				incomingInteractions.retainOnly(
					InteractionKind.Call,
					offers.map((call) => call.id),
				);

				for (const call of offers) {
					incomingInteractions.notify({
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

	/**
	 * @author Oleksandr Palonnyi
	 * Only media is handled per event: call state is read from the SDK's
	 * reactive call store, so it needs no event bookkeeping here. The SDK never
	 * attaches remote media to an output itself, so without `PeerStream` every
	 * call connects silently.
	 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
	 */
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
		/**
		 * @author Oleksandr Palonnyi
		 * Also required for the SDK to populate its call store at all.
		 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
		 */
		client.subscribeCall(onCallEvent, null);

		incomingInteractions.initialize();
		subscribeToOffers();
	}

	return {
		callList,
		incomingOffers,
		isDialing,

		initialize,
		call,
		answer,
		toggleMute,
		hangup,
	};
});

/**
 * @author Oleksandr Palonnyi
 * A denied mic still produces a *connected* call the other side hears nothing
 * on, which is invisible from the agent's side — gate every call on it.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
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
