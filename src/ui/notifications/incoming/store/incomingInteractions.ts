import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, shallowRef, toValue } from 'vue';

import i18n from '../../../../app/locale/i18n';
import { useOsNotifications } from '../../push/useOsNotifications';
import { useOfferChirp } from '../../sound/useOfferChirp';
import { useRingtone } from '../../sound/useRingtone';
import {
	type IncomingInteraction,
	InteractionKind,
} from '../../types/IncomingInteraction.types';

/**
 * Incoming call/chat offers.
 *
 * Domain stores (`features/calls`, later `features/chats`) call `notify` /
 * `dismiss`; this module owns everything the operator perceives — the card, the
 * ringtone and the OS notification. It never imports an SDK.
 *
 * Kept apart from `useNotificationsStore` (generic toasts) on purpose: offers
 * live until the interaction resolves rather than timing out, stack in their own
 * corner, and render a fixed layout from `DES-727`.
 */
export const useIncomingInteractionsStore = defineStore(
	'incomingInteractions',
	() => {
		const ringtone = useRingtone();
		const chirp = useOfferChirp();
		const osNotifications = useOsNotifications();

		/**
		 * `shallowRef` is load-bearing: entries hold a `preview` ref, and a deep
		 * `ref([])` would unwrap it on property access, collapsing the live preview
		 * into a snapshot. Mutations replace the array.
		 */
		const interactions = shallowRef<IncomingInteraction[]>([]);

		const hasInteractions = computed(() => interactions.value.length > 0);

		function find(id: string): IncomingInteraction | undefined {
			return interactions.value.find((interaction) => interaction.id === id);
		}

		function kindOf(interaction: IncomingInteraction): InteractionKind {
			return toValue(interaction.preview).kind;
		}

		/** Only calls ring; a chat offer must not keep the ringtone alive. */
		function hasRingingOffer(): boolean {
			return interactions.value.some(
				(interaction) => kindOf(interaction) === InteractionKind.Call,
			);
		}

		function pushOsNotification(interaction: IncomingInteraction) {
			const preview = toValue(interaction.preview);
			const title = i18n.global.t(
				`ui.notifications.incoming.title.${preview.kind}`,
			);
			const name =
				preview.name ??
				i18n.global.t('ui.notifications.incoming.unknownContact');

			osNotifications.show({
				id: interaction.id,
				title: preview.source
					? `${title}\n${preview.source.label}: ${preview.source.value}`
					: title,
				body: preview.identifier ? `${name}: ${preview.identifier}` : name,
				actions: [
					{
						action: 'accept',
						title: i18n.global.t('ui.notifications.incoming.accept'),
					},
					{
						action: 'decline',
						title: i18n.global.t('ui.notifications.incoming.decline'),
					},
				],
				onAction: (action) => {
					if (action === 'accept') accept(interaction.id);
					if (action === 'decline') decline(interaction.id);
				},
			});
		}

		function notify(interaction: IncomingInteraction) {
			if (find(interaction.id)) return; // already offered

			// a ring already in progress suppresses the chirp — read it before adding
			const wasRinging = hasRingingOffer();

			interactions.value = [
				...interactions.value,
				interaction,
			];

			if (kindOf(interaction) === InteractionKind.Call) {
				// one ring for any number of offers
				ringtone.start();
			} else if (!wasRinging) {
				// a call has a deadline and a text chat does not: never talk over it
				chirp.play();
			}

			pushOsNotification(interaction);
		}

		function dismiss(id: string) {
			if (!find(id)) return;

			interactions.value = interactions.value.filter(
				(interaction) => interaction.id !== id,
			);

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
		function retainOnly(kind: InteractionKind, ids: string[]) {
			const live = new Set(ids);

			// iterate a copy — dismiss() replaces the backing array
			for (const interaction of [
				...interactions.value,
			]) {
				if (toValue(interaction.preview).kind !== kind) continue;
				if (!live.has(interaction.id)) dismiss(interaction.id);
			}
		}

		/**
		 * Accept/decline dismiss optimistically so the card can't be clicked twice
		 * while the SDK round-trips. The producer's own teardown is idempotent.
		 */
		function accept(id: string) {
			const interaction = find(id);
			if (!interaction) return;
			dismiss(id);
			interaction.onAccept();
		}

		function decline(id: string) {
			const interaction = find(id);
			if (!interaction) return;
			dismiss(id);
			interaction.onDecline();
		}

		function openBody(id: string) {
			find(id)?.onBodyClick?.();
		}

		function initialize() {
			osNotifications.initialize();
		}

		return {
			interactions,
			hasInteractions,

			initialize,
			notify,
			dismiss,
			retainOnly,
			accept,
			decline,
			openBody,
		};
	},
);

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useIncomingInteractionsStore, import.meta.hot),
	);
}
