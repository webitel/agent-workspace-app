import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import type { ChatWindowMode, OpenChat } from '../types/ChatSession.types';
import { disposeChatSession, useChatSessionStore } from './chat-session';

// Singleton coordinator: owns the SDK task feed and window layout. Per-chat
// history lives in dynamic chat-session stores; this store never holds it.
export const useChatsStore = defineStore('chats', () => {
	const { getClient, tasks } = useWebSocketClient();

	const chatTaskList = computed(() => {
		return tasks.value?.filter(({ channel }) => channel === 'im');
	});

	const openChats = ref<OpenChat[]>([]);
	const mainChat = computed(() =>
		openChats.value.find((chat) => chat.mode === 'main'),
	);
	const minimizedChats = computed(() =>
		openChats.value.filter((chat) => chat.mode === 'minimized'),
	);
	const isOpen = (id: string) => openChats.value.some((chat) => chat.id === id);

	function openChat(id: string, mode: ChatWindowMode = 'main') {
		if (!isOpen(id))
			openChats.value.push({
				id,
				mode,
			});
		setMode(id, mode);
		useChatSessionStore(id).load();
	}

	function setMode(id: string, mode: ChatWindowMode) {
		const target = openChats.value.find((chat) => chat.id === id);
		if (!target) return;
		// only one main window — demote the current main
		if (mode === 'main') {
			openChats.value.forEach((chat) => {
				if (chat.mode === 'main') chat.mode = 'minimized';
			});
		}
		target.mode = mode;
	}

	function closeChat(id: string) {
		openChats.value = openChats.value.filter((chat) => chat.id !== id);
		disposeChatSession(id);
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
