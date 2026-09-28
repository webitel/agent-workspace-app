import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';

export const useWorkspaceSidebarStore = defineStore('sidebar', () => {
	const isOpen = ref(false);

	function open() {
		isOpen.value = true;
	}

	function close() {
		isOpen.value = false;
	}

	function toggle() {
		isOpen.value = !isOpen.value;
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
