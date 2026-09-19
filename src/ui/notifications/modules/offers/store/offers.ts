import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, shallowRef, toValue } from 'vue';

import i18n from '../../../../../app/locale/i18n';
import { useOsNotifications } from '../../push/composables/useOsNotifications';
import { useOfferChirp } from '../../sound/composables/useOfferChirp';
import { useRingtone } from '../../sound/composables/useRingtone';
import { type Offer, type OfferAction, OfferKind } from '../types/Offer.types';

/**
 * Incoming call/chat offers.
 *
 * Domain stores (`features/calls`, `features/chats`) call `notify` / `dismiss`;
 * this module owns everything the operator perceives — the card, the ringtone
 * and the OS notification. It never imports an SDK.
 *
 * Kept apart from toasts (`wt-notifications-bar`, fed by the shared eventBus)
 * on purpose: offers live until the offer resolves rather than timing
 * out, and render a fixed layout from `DES-727`. Both share one corner via
 * `the-notifications-layer`.
 */
export const useOffersStore = defineStore('offers', () => {
	const ringtone = useRingtone();
	const chirp = useOfferChirp();
	const osNotifications = useOsNotifications();

	/**
	 * `shallowRef` is load-bearing: entries hold a `preview` ref, and a deep
	 * `ref([])` would unwrap it on property access, collapsing the live preview
	 * into a snapshot. Mutations replace the array.
	 */
	const offers = shallowRef<Offer[]>([]);

	const hasOffers = computed(() => offers.value.length > 0);

	/**
	 * Which action is in flight per offer, so the card can disable both buttons
	 * and show progress on the one that was pressed. A `Map` inside a `ref` is
	 * reactive through Vue's collection handlers.
	 */
	const pendingActions = ref(new Map<string, OfferAction>());

	function pendingAction(id: string): OfferAction | undefined {
		return pendingActions.value.get(id);
	}

	function find(id: string): Offer | undefined {
		return offers.value.find((offer) => offer.id === id);
	}

	function kindOf(offer: Offer): OfferKind {
		return toValue(offer.preview).kind;
	}

	/** Only calls ring; a chat offer must not keep the ringtone alive. */
	function hasRingingOffer(): boolean {
		return offers.value.some((offer) => kindOf(offer) === OfferKind.Call);
	}

	function pushOsNotification(offer: Offer) {
		const preview = toValue(offer.preview);
		const title = i18n.global.t(`ui.notifications.offer.title.${preview.kind}`);
		const name =
			preview.name ?? i18n.global.t('ui.notifications.offer.unknownContact');

		osNotifications.show({
			id: offer.id,
			title: preview.source
				? `${title}\n${preview.source.label}: ${preview.source.value}`
				: title,
			body: preview.identifier ? `${name}: ${preview.identifier}` : name,
			actions: [
				{
					action: 'accept',
					title: i18n.global.t('ui.notifications.offer.accept'),
				},
				{
					action: 'decline',
					title: i18n.global.t('ui.notifications.offer.decline'),
				},
			],
			onAction: (action) => {
				if (action === 'accept') accept(offer.id);
				if (action === 'decline') decline(offer.id);
			},
		});
	}

	function notify(offer: Offer) {
		if (find(offer.id)) return; // already offered

		// a ring already in progress suppresses the chirp — read it before adding
		const wasRinging = hasRingingOffer();

		offers.value = [
			...offers.value,
			offer,
		];

		if (kindOf(offer) === OfferKind.Call) {
			// one ring for any number of offers
			ringtone.start();
		} else if (!wasRinging) {
			// a call has a deadline and a text chat does not: never talk over it
			chirp.play();
		}

		pushOsNotification(offer);
	}

	function dismiss(id: string) {
		if (!find(id)) return;

		offers.value = offers.value.filter((offer) => offer.id !== id);

		osNotifications.close(id);
		if (!hasRingingOffer()) ringtone.stop();
	}

	/**
	 * Reconcile one channel's offers against what is still on the wire.
	 *
	 * Scoped by kind: producers own their own channel, and a call-feed update
	 * must not dismiss chat offers (or the reverse) once both are live. Keeping
	 * the reconciliation here also spares producers from walking this store's
	 * internals.
	 */
	function retainOnly(kind: OfferKind, ids: string[]) {
		const live = new Set(ids);

		// iterate a copy — dismiss() replaces the backing array
		for (const offer of [
			...offers.value,
		]) {
			if (toValue(offer.preview).kind !== kind) continue;
			if (!live.has(offer.id)) dismiss(offer.id);
		}
	}

	/**
	 * Run an offer's action and leave the card alone.
	 *
	 * Offers are derived, so a successful accept or decline removes the card on
	 * its own: the interaction stops matching its producer's predicate and
	 * `retainOnly` drops it. Dismissing here only hid that latency — and on the
	 * failure path it lied. A denied microphone returns from `answer()` without
	 * ever reaching the SDK, so the optimistic dismiss left the agent with an
	 * invisible, silent, still-ringing call.
	 *
	 * The in-flight marker replaces the double-click guard the dismiss used to
	 * provide: while an action runs the card disables both buttons, so the SDK
	 * is never asked twice.
	 */
	async function runAction(id: string, action: OfferAction) {
		const offer = find(id);
		if (!offer || pendingActions.value.has(id)) return;

		pendingActions.value.set(id, action);

		try {
			await (action === 'accept' ? offer.onAccept() : offer.onDecline());
		} catch (err) {
			// the offer is still live, so the card stays and the agent can retry
			console.error(`[notifications] offer ${action} failed`, err);
		} finally {
			pendingActions.value.delete(id);
		}
	}

	function accept(id: string) {
		return runAction(id, 'accept');
	}

	function decline(id: string) {
		return runAction(id, 'decline');
	}

	function openBody(id: string) {
		find(id)?.onBodyClick?.();
	}

	function initialize() {
		osNotifications.initialize();
	}

	return {
		offers,
		hasOffers,

		initialize,
		notify,
		dismiss,
		retainOnly,
		pendingAction,
		accept,
		decline,
		openBody,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useOffersStore, import.meta.hot));
}
