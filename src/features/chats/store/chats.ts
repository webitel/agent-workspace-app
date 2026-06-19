import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed } from 'vue';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';

export const useChatsStore = defineStore('chats', () => {
	const { getClient, tasks } = useWebSocketClient();

	const chatTaskList = computed(() => {
		return tasks.value?.filter(({ channel }) => channel === 'im');
	});

	function initialize() {
		const client = getClient();
		client.subscribeTask(() => {
			// todo: show notifications about new tasks
		});
	}

	return {
		// getters
		// tasks,
		chatTaskList,

		// actions
		initialize,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatsStore, import.meta.hot));
}
