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

	const isUnknownSelected = computed(
		() => selection.value?.type === SidebarSelectionType.Unknown,
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

	// A row without a linked contact still opens the panel, as an unknown contact
	function selectContactOrUnknown(id?: string | number | null) {
		if (id) {
			selectContact(String(id));
			return;
		}
		selectUnknownContact();
	}

	function clearSelection() {
		selection.value = null;
	}

	return {
		selection,
		contactId,
		isUnknownSelected,
		selectContact,
		selectUnknownContact,
		selectContactOrUnknown,
		clearSelection,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useSidebarSelectionStore, import.meta.hot),
	);
}
