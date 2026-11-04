import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { SidebarSelectionType } from '../enums/SidebarSelectionType.enum';
import type { SidebarSelection } from '../types/SidebarSelection.types';
import { useWorkspaceSidebarStore } from './workspace-sidebar';

export const useSidebarSelectionStore = defineStore('sidebar-selection', () => {
	const sidebarStore = useWorkspaceSidebarStore();

	const selection = ref<SidebarSelection | null>(null);

	const contactId = computed(() =>
		selection.value?.type === SidebarSelectionType.Contact
			? selection.value.id
			: null,
	);

	function selectContact(id: string) {
		selection.value = {
			type: SidebarSelectionType.Contact,
			id,
		};
		sidebarStore.open();
	}

	function selectUnknownContact() {
		selection.value = {
			type: SidebarSelectionType.Unknown,
		};
		sidebarStore.open();
	}

	function clearSelection() {
		selection.value = null;
	}

	return {
		selection,
		contactId,
		selectContact,
		selectUnknownContact,
		clearSelection,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useSidebarSelectionStore, import.meta.hot),
	);
}
