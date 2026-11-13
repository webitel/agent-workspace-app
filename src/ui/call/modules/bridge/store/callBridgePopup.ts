import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * @author Oleksandr Palonnyi
 * what the bridge popup shares with whatever opens it is the call the agent
 * started from; the call it is connected to is picked inside the popup
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const useCallBridgePopupStore = defineStore('callBridgePopup', () => {
	const bridgeCallId = ref<string | null>(null);

	const isOpenBridgePopup = computed(() => bridgeCallId.value !== null);

	function open(callId: string): void {
		bridgeCallId.value = callId;
	}

	function close(): void {
		bridgeCallId.value = null;
	}

	return {
		bridgeCallId,
		isOpenBridgePopup,

		open,
		close,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useCallBridgePopupStore, import.meta.hot),
	);
}
