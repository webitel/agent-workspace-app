import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';

export const useTaskDockStore = defineStore('taskDock', () => {
	const expandedCallId = ref<string | null>(null);
	const expandedChatId = ref<string | null>(null);

	function setCallExpanded(id: string, isExpanded: boolean): void {
		if (isExpanded) {
			expandedCallId.value = id;
		} else if (expandedCallId.value === id) {
			expandedCallId.value = null;
		}
	}

	function toggleChatExpand(id: string) {
		expandedChatId.value = expandedChatId.value === id ? null : id;
	}

	return {
		expandedCallId,
		expandedChatId,
		setCallExpanded,
		toggleChatExpand,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useTaskDockStore, import.meta.hot));
}
