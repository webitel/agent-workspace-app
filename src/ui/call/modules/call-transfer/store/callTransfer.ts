import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * @author Oleksandr Palonnyi
 * the call transfer is started from two places, the call window's top bar and
 * the expanded call dock, and both open the same popup, so what they share is
 * the call being transferred
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const useCallTransferStore = defineStore('callTransfer', () => {
	const transferCallId = ref<string | null>(null);

	const isOpen = computed(() => transferCallId.value !== null);

	function open(callId: string): void {
		transferCallId.value = callId;
	}

	function close(): void {
		transferCallId.value = null;
	}

	return {
		transferCallId,
		isOpen,

		open,
		close,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useCallTransferStore, import.meta.hot),
	);
}
