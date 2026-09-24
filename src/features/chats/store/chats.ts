import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, getCurrentScope, ref, watch } from 'vue';
import type { Task } from 'webitel-sdk';
import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import { router } from '../../../app/router';
import { useOffersStore } from '../../../ui/notifications/modules/offers/store/offers';
import { OfferKind } from '../../../ui/notifications/modules/offers/types/Offer.types';
import { useChatsSocket } from '../composables/useChatsSocket';
import { isChatTask } from '../scripts/isChatTask';
import { isIncomingChatOffer } from '../scripts/isIncomingChatOffer';
import { toIncomingChatPreview } from '../scripts/toIncomingChatPreview';
import type { ChatWindowMode, OpenChat } from '../types/ChatSession.types';
import { disposeChatSession, useChatSessionStore } from './chat-session';

// Singleton coordinator: owns the SDK task feed and window layout. Per-chat
// history lives in dynamic chat-session stores; this store never holds it.
export const useChatsStore = defineStore('chats', () => {
	// captured during setup so the offer watcher belongs to the store and stops
	// with `$dispose()`; created from an action it would outlive the store
	const storeScope = getCurrentScope();

	const { getClient, tasks } = useWebSocketClient();
	const { connect: connectChatsSocket, onThreadMessage } = useChatsSocket();
	const offersStore = useOffersStore();

	const allChatTasks = computed<Task[]>(
		() => (tasks.value ?? []).filter(isChatTask) as Task[],
	);

	/**
	 * Offered chats are deliberately absent: the offer card is the only surface
	 * for them (DES-727), and a row here would invite the agent to open a thread
	 * they are not a member of yet. They join the list once accepted
	 * (AC_06.01.02).
	 */
	const chatTaskList = computed(() =>
		allChatTasks.value.filter((task) => !isIncomingChatOffer(task)),
	);

	const incomingOffers = computed(() =>
		allChatTasks.value.filter(isIncomingChatOffer),
	);

	// TODO: замінити на реальний підрахунок нових чатів
	const newChatsCount = computed(() => 5);

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

	/**
	 * Accepting from the card also opens the chat: the accept button is the
	 * "take it and go there" action, while clicking the card body navigates
	 * without accepting (AC_06.01.04).
	 */
	async function acceptOffer(task: Task) {
		await task.accept();
		const threadId = task.thread?.id;
		if (threadId) openChat(threadId);
	}

	function declineOffer(task: Task) {
		// `decline()` and `close()` are the same request; the backend decides
		// whether the chat ends or goes to the next agent (AC_06.01.03).
		return task.decline();
	}

	/**
	 * Offers are derived from the task feed rather than pushed, so a chat leaves
	 * the card on every exit — accepted, declined, abandoned, redistributed —
	 * without enumerating task actions. Diffing is by id because the SDK mutates
	 * `Task` objects in place.
	 */
	function subscribeToOffers() {
		const register = () =>
			watch(
				incomingOffers,
				(offers) => {
					offersStore.retainOnly(
						OfferKind.Chat,
						offers.map((task) => String(task.id)),
					);

					for (const task of offers) {
						offersStore.notify({
							// the task owns the offer's lifecycle; the thread id is only
							// needed for navigation, and may not be there at all
							id: String(task.id),
							preview: () => toIncomingChatPreview(task),
							onAccept: () => acceptOffer(task),
							onDecline: () => declineOffer(task),
							onBodyClick: task.thread?.id
								? () => openChat(task.thread?.id as string)
								: undefined,
						});
					}
				},
				{
					deep: true,
				},
			);

		if (storeScope) storeScope.run(register);
		else register();
	}

	function initialize() {
		const client = getClient();
		// the SDK needs a subscriber before it will populate the task feed
		client.subscribeTask(() => {});

		offersStore.initialize();
		subscribeToOffers();

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
		incomingOffers,
		newChatsCount,
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
