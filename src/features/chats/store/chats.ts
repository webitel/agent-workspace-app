import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import type { ChatWindowMode, OpenChat } from '../types/ChatSession.types';
import { disposeChatSession, useChatSessionStore } from './chat-session';

/**
 * Coordinator (singleton). Owns the SDK task feed + which chats are open and
 * their window layout. Per-chat history/data lives in dynamic chat-session
 * stores — see ./chat-session. This store never holds message history.
 */
export const useChatsStore = defineStore('chats', () => {
	const { getClient, tasks } = useWebSocketClient();

	// --- SDK-driven feed ---
	const chatTaskList = computed(() => {
		return tasks.value?.filter(({ channel }) => channel === 'im');
	});

	// --- UI-driven window state ---
	const openChats = ref<OpenChat[]>([]);
	const mainChat = computed(() =>
		openChats.value.find((c) => c.mode === 'main'),
	);
	const minimizedChats = computed(() =>
		openChats.value.filter((c) => c.mode === 'minimized'),
	);
	const isOpen = (id: string) => openChats.value.some((c) => c.id === id);

	function openChat(id: string, mode: ChatWindowMode = 'main') {
		if (!isOpen(id))
			openChats.value.push({
				id,
				mode,
			});
		setMode(id, mode);
		// create + warm up the per-chat store
		useChatSessionStore(id).load();
	}

	function setMode(id: string, mode: ChatWindowMode) {
		const chat = openChats.value.find((c) => c.id === id);
		if (!chat) return;
		if (mode === 'main') {
			openChats.value.forEach((c) => {
				if (c.mode === 'main') c.mode = 'minimized';
			});
		}
		chat.mode = mode;
	}

	function closeChat(id: string) {
		openChats.value = openChats.value.filter((c) => c.id !== id);
		disposeChatSession(id); // teardown per-chat store + state
	}

	function initialize() {
		const client = getClient();
		client.subscribeTask(() => {
			// todo: show notifications about new tasks
		});
	}

	return {
		// getters
		chatTaskList,
		openChats,
		mainChat,
		minimizedChats,
		isOpen,

		// actions
		openChat,
		setMode,
		closeChat,
		initialize,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatsStore, import.meta.hot));
}
