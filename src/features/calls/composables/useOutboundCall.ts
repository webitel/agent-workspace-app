import { computed, readonly, ref } from 'vue';

import { useOutboundCallAttemptsStore } from '../store/outboundCallAttempts';

/**
 * Dials a number through an outbound attempt rather than `callsStore.call`, so
 * the agent gets the outbound call card (AC_20.03.01); opening the call page per
 * `open_new_interaction_card` (E28) is not built. `isCalling` and
 * `callingNumber` cover the request, so a caller can lock all its call buttons
 * or only the clicked one until it settles; a call in the meantime is dropped
 * [WS-170](https://webitel.atlassian.net/browse/WS-170)
 */
export function useOutboundCall() {
	const outboundCallAttemptsStore = useOutboundCallAttemptsStore();

	const callingNumber = ref<string | null>(null);

	const isCalling = computed(() => callingNumber.value !== null);

	async function call(number?: string): Promise<void> {
		if (!number || isCalling.value) return;

		callingNumber.value = number;
		try {
			await outboundCallAttemptsStore.start(number);
		} finally {
			callingNumber.value = null;
		}
	}

	return {
		isCalling,
		callingNumber: readonly(callingNumber),
		call,
	};
}
