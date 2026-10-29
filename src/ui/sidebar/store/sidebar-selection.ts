import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';
import { useWorkspaceSidebarStore } from './workspace-sidebar';

export const useSidebarSelectionStore = defineStore('sidebar-selection', () => {
	const sidebarStore = useWorkspaceSidebarStore();

	const contactId = ref<string | null>(null);

	function selectContact(id: string) {
		contactId.value = id;
		sidebarStore.open();
	}

	function clearSelection() {
		contactId.value = null;
	}

	return {
		contactId,
		selectContact,
		clearSelection,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useSidebarSelectionStore, import.meta.hot),
	);
}
