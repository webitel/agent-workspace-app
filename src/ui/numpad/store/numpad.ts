import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';

export const useNumpadStore = defineStore('numpad', () => {
	const isOpen = ref(false);
	const prefilledNumber = ref('');

	/**
	 * @author Oleksandr Palonnyi
	 * "Back to dialpad" after No answer reopens the numpad with the number that
	 * was dialled (US_16.01 AC_16.01.05), so the agent can correct it.
	 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
	 */
	function open(numberToPrefill = '') {
		prefilledNumber.value = numberToPrefill;
		isOpen.value = true;
	}

	function close() {
		isOpen.value = false;
	}

	function toggle() {
		if (isOpen.value) {
			close();
		} else {
			open();
		}
	}

	return {
		isOpen,
		prefilledNumber,

		open,
		close,
		toggle,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useNumpadStore, import.meta.hot));
}
