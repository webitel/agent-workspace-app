import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { useCallsStore } from '../../../features/calls/store/calls';
import { useOutboundCallAttemptsStore } from '../../../features/calls/store/outboundCallAttempts';

export const useTaskDockStore = defineStore('taskDock', () => {
	const expandedCallId = ref<string | null>(null);
	const expandedChatId = ref<string | null>(null);

	const callsStore = useCallsStore();

	/**
	 * @author Oleksandr Palonnyi
	 * `expandedCallId` is cleared only when the agent collapses the dock or hangs up
	 * from it. A call the client hung up, one hung up from the Call window, or one
	 * gone to post-processing leaves its id behind, so an id is an open dock only
	 * while its call is still active; otherwise the next answered call would never
	 * expand. A held call does not count either: dialling from the numpad holds the
	 * call whose dock is open, and the dock would then stay on it while the answered
	 * call, the one the agent is talking on, sat collapsed
	 * [WS-155](https://webitel.atlassian.net/browse/WS-155)
	 */
	const isExpandedCallLive = computed(() =>
		callsStore.activeCalls.some(
			(call) => call.id === expandedCallId.value && !call.isHold,
		),
	);

	let isInitialized = false;

	function setCallExpanded(id: string, isExpanded: boolean): void {
		if (isExpanded) {
			expandedCallId.value = id;
		} else if (expandedCallId.value === id) {
			expandedCallId.value = null;
		}
	}

	/**
	 * @author Oleksandr Palonnyi
	 * Unlike `setCallExpanded`, this is not the agent's own choice, so it never takes
	 * the dock from a live call the agent has open: they may be mid-DTMF or
	 * mid-transfer there. The answered call then stays a collapsed pill, and of two
	 * calls answered together the first one is expanded
	 * [WS-155](https://webitel.atlassian.net/browse/WS-155)
	 */
	function expandAnsweredCall(id: string): void {
		if (isExpandedCallLive.value) return;

		expandedCallId.value = id;
	}

	function toggleChatExpand(id: string) {
		expandedChatId.value = expandedChatId.value === id ? null : id;
	}

	/**
	 * @author Oleksandr Palonnyi
	 * The subscription belongs to the store that owns `expandedCallId`, not to the
	 * lane component: a lane that is unmounted or rendered conditionally would lose
	 * the event without any error
	 * [WS-155](https://webitel.atlassian.net/browse/WS-155)
	 */
	function initialize() {
		if (isInitialized) return;
		isInitialized = true;

		useOutboundCallAttemptsStore().onAttemptAnswered(expandAnsweredCall);
	}

	return {
		expandedCallId,
		expandedChatId,

		initialize,
		setCallExpanded,
		expandAnsweredCall,
		toggleChatExpand,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useTaskDockStore, import.meta.hot));
}
