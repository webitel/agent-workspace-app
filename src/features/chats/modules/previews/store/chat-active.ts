import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { useChatsStore } from '../../../store/chats';
import { useChatPreviewsStore } from './chat-previews';
import { useChatSnoozedStore } from './chat-snoozed';

/**
 * The Active tab's chats: every chat the agent has accepted and not snoozed, or
 * the unread ones when the filter is on (AC_02.01.04). The chats themselves
 * belong to the task feed, which `chats` owns; this store is what the Active
 * tab makes of them. Only call-center chats are here: an internal chat has no
 * task and is reached from the chats table instead (ADR-0011).
 */
export const useChatActiveStore = defineStore('chat-active', () => {
	const chatsStore = useChatsStore();
	const previewsStore = useChatPreviewsStore();
	const snoozedStore = useChatSnoozedStore();

	const onlyUnread = ref(false);

	// a chat is on exactly one tab, so a snoozed one is not here
	const activeTasks = computed(() =>
		chatsStore.chatTaskList.filter(
			(task) => !snoozedStore.isSnoozed(task.thread?.id ?? ''),
		),
	);

	/**
	 * The toggle exists only while there is unread data behind it; the backend
	 * does not supply any yet (see `chat-previews`). Gating on the data rather
	 * than on a flag means nothing changes here the day it arrives.
	 */
	const isUnreadFilterAvailable = computed(() => previewsStore.hasUnreadData);

	// a chosen filter without data would empty the list for no reason
	const isFilteringUnread = computed(
		() => onlyUnread.value && isUnreadFilterAvailable.value,
	);

	const isUnread = (task: {
		thread?: {
			id?: string;
		};
	}) => previewsStore.isUnread(task.thread?.id ?? '');

	const tasks = computed(() =>
		isFilteringUnread.value
			? activeTasks.value.filter(isUnread)
			: activeTasks.value,
	);

	// the tab's indicator counts its chats, not what the unread filter leaves
	const count = computed(() => activeTasks.value.length);

	/**
	 * Zero while there is no unread data, so the indicator stays out of sight
	 * rather than claiming nothing is unread.
	 */
	const unreadCount = computed(() =>
		isUnreadFilterAvailable.value
			? activeTasks.value.filter(isUnread).length
			: 0,
	);

	function toggleOnlyUnread() {
		onlyUnread.value = !onlyUnread.value;
	}

	return {
		// state
		onlyUnread,

		// getters
		isUnreadFilterAvailable,
		isFilteringUnread,
		tasks,
		count,
		unreadCount,

		// actions
		toggleOnlyUnread,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatActiveStore, import.meta.hot));
}
