import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';

export const useNumpadStore = defineStore('numpad', () => {
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
	import.meta.hot.accept(acceptHMRUpdate(useNumpadStore, import.meta.hot));
}
