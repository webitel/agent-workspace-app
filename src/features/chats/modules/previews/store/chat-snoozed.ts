import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, shallowRef } from 'vue';
import type { Task } from 'webitel-sdk';

/**
 * The agent's snoozed chats. Nothing supplies them yet: there is no design for
 * the snooze action and the backend keeps no such state (WS-56, WS-60), and a
 * snooze kept on the client would be one the agent loses on refresh. It is the
 * single place the real source will land, like `unreadByThread` in
 * `chat-previews`, so the Snoozed tab and its indicator exist and stay empty.
 *
 * The chats here are not in the Active tab, and the day a source arrives it
 * has to keep the two apart; nothing does yet because nothing can overlap.
 */
export const useChatSnoozedStore = defineStore('chat-snoozed', () => {
	// reassigned, never mutated, so shallow reactivity is enough
	const tasks = shallowRef<Task[]>([]);

	const count = computed(() => tasks.value.length);

	return {
		// state
		tasks,

		// getters
		count,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatSnoozedStore, import.meta.hot));
}
