import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { useChatsStore } from '../../../store/chats';
import { useChatPreviewsStore } from './chat-previews';

/**
 * The Active tab's chats: every chat the agent has accepted, or the unread ones
 * when the filter is on (AC_02.01.04). The chats themselves belong to the task
 * feed, which `chats` owns; this store is what the Active tab makes of them.
 *
 * Paging on scroll (AC_02.01.02) is deliberately not here yet; the list is every
 * active chat the task feed carries.
 */
export const useChatActiveStore = defineStore('chat-active', () => {
	const chatsStore = useChatsStore();
	const previewsStore = useChatPreviewsStore();

	const onlyUnread = ref(false);

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
			? chatsStore.chatTaskList.filter(isUnread)
			: chatsStore.chatTaskList,
	);

	// the tab's indicator counts its chats, not what the unread filter leaves
	const count = computed(() => chatsStore.chatTaskList.length);

	/**
	 * Zero while there is no unread data, so the indicator stays out of sight
	 * rather than claiming nothing is unread.
	 */
	const unreadCount = computed(() =>
		isUnreadFilterAvailable.value
			? chatsStore.chatTaskList.filter(isUnread).length
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
