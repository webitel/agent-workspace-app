import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import { router } from '../../../app/router';
import { useNotificationsStore } from '../../../ui/notifications/store/notifications';
import { useChatsSocket } from '../composables/useChatsSocket';
import type { ChatWindowMode, OpenChat } from '../types/ChatSession.types';
import { disposeChatSession, useChatSessionStore } from './chat-session';

// Singleton coordinator: owns the SDK task feed and window layout. Per-chat
// history lives in dynamic chat-session stores; this store never holds it.
export const useChatsStore = defineStore('chats', () => {
	const { getClient, tasks } = useWebSocketClient();
	const { connect: connectChatsSocket, onThreadMessage } = useChatsSocket();
	const notifications = useNotificationsStore();

	const chatTaskList = computed(() => {
		return tasks.value?.filter(({ channel }) => channel === 'im');
	});

	// The route param threadId equals task.thread.id, so the open chat's SDK task
	// (carrying its processing form) is looked up by thread id.
	const getTaskByThreadId = (id: string) =>
		chatTaskList.value?.find((task) => task.thread?.id === id);

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
		// main window mirrors the URL; skip the push when already there so a
		// route-triggered open (deep link, back/forward) doesn't loop back.
		if (
			mode === 'main' &&
			router &&
			router.currentRoute.value.params.threadId !== id
		) {
			router.push(`/chats/${id}`);
		}
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

	// task.id -> notification id, so the offer notification can be dropped once
	// the task resolves on its own (bridged / missed / closed).
	const taskNotifications = new Map<number, string>();

	function initialize() {
		const client = getClient();
		client.subscribeTask((_action, task) => {
			if (!task || task.channel !== 'im') return;
			const offered = task.bridgedAt === 0 && task.closedAt === 0;

			if (offered) {
				if (taskNotifications.has(task.id)) return; // already showing
				const notificationId = notifications.notify({
					title: 'New chat',
					text: task.thread?.subject || task.displayName || task.display,
					actions: [
						{
							label: 'Accept',
							color: 'success',
							handler: () => task.accept(),
						},
						{
							label: 'Reject',
							color: 'danger',
							handler: () => task.decline(),
						},
					],
				});
				taskNotifications.set(task.id, notificationId);
			} else {
				const notificationId = taskNotifications.get(task.id);
				if (notificationId) {
					notifications.dismiss(notificationId);
					taskNotifications.delete(task.id);
				}
			}
		});

		connectChatsSocket();
		onThreadMessage((message) => {
			if (!message.threadId || !isOpen(message.threadId)) return;
			useChatSessionStore(message.threadId).receiveMessage(message);
		});
	}

	return {
		// getters
		chatTaskList,
		getTaskByThreadId,
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
