import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';

export const useTaskDockStore = defineStore('taskDock', () => {
	const expandedCallId = ref<string | null>(null);
	const expandedChatId = ref<string | null>(null);

	function toggleCallExpand(id: string) {
		expandedCallId.value = expandedCallId.value === id ? null : id;
	}

	function toggleChatExpand(id: string) {
		expandedChatId.value = expandedChatId.value === id ? null : id;
	}

	return {
		expandedCallId,
		expandedChatId,
		toggleCallExpand,
		toggleChatExpand,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useTaskDockStore, import.meta.hot));
}
