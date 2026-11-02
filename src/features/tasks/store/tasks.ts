import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, getCurrentScope, watch } from 'vue';
import type { Task } from 'webitel-sdk';
import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import { useOffersStore } from '../../../ui/notifications/modules/offers/store/offers';
import { OfferKind } from '../../../ui/notifications/modules/offers/types/Offer.types';
import { isIncomingTaskOffer } from '../scripts/isIncomingTaskOffer';
import { toTaskOfferContent } from '../scripts/toTaskOfferContent';

// Job-channel coordinator: for now it only turns offered jobs into offer cards.
export const useTasksStore = defineStore('tasks', () => {
	// captured during setup so the offer watcher belongs to the store and stops
	// with `$dispose()`; created from an action it would outlive the store
	const storeScope = getCurrentScope();

	const { tasks } = useWebSocketClient();
	const offersStore = useOffersStore();

	const incomingOffers = computed<Task[]>(
		() => (tasks.value ?? []).filter(isIncomingTaskOffer) as Task[],
	);

	/**
	 * Offers are derived from the task feed rather than pushed, like chat
	 * offers, so a job leaves the card on every exit without enumerating task
	 * actions. Diffing is by id because the SDK mutates `Task` objects in place.
	 */
	function subscribeToOffers() {
		const register = () =>
			watch(
				incomingOffers,
				(offers) => {
					offersStore.retainOnly(
						OfferKind.Task,
						offers.map((task) => String(task.id)),
					);

					for (const task of offers) {
						offersStore.notify({
							id: String(task.id),
							content: () => toTaskOfferContent(task),
							onAccept: () => task.accept(),
							// `decline()` and `close()` are the same request; the backend
							// decides whether the job ends or goes to the next agent
							onDecline: () => task.decline(),
						});
					}
				},
				{
					deep: true,
				},
			);

		if (storeScope) storeScope.run(register);
		else register();
	}

	// the task feed is populated by the chats coordinator's `subscribeTask`
	function initialize() {
		subscribeToOffers();
	}

	return {
		// getters
		incomingOffers,

		// actions
		initialize,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useTasksStore, import.meta.hot));
}
