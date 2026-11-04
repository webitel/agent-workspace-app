import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';
import { useSidebarSelectionStore } from './sidebar-selection';

export const useWorkspaceSidebarStore = defineStore('sidebar', () => {
	const isOpen = ref(false);

	function open() {
		isOpen.value = true;
	}

	/**
	 * The selection lives only while the panel is open,
	 * so the next open starts from the empty state.
	 * The selection store is resolved here, not in setup:
	 * the two stores depend on each other
	 */
	function close() {
		isOpen.value = false;
		useSidebarSelectionStore().clearSelection();
	}

	function toggle() {
		if (isOpen.value) close();
		else open();
	}

	return {
		isOpen,
		open,
		close,
		toggle,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useWorkspaceSidebarStore, import.meta.hot),
	);
}
