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

	/**
	 * A row that carries no contact, only a number (an offline member):
	 * the panel looks the contact up by it
	 * [WS-30](https://webitel.atlassian.net/browse/WS-30)
	 */
	function selectPhoneNumber(phoneNumber?: string) {
		selection.value = {
			type: SidebarSelectionType.PhoneNumber,
			phoneNumber,
		};
		sidebarStore.open();
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
		selectPhoneNumber,
		clearSelection,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useSidebarSelectionStore, import.meta.hot),
	);
}
