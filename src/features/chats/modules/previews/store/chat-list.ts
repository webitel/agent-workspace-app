import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { useChatsStore } from '../../../store/chats';
import { useChatPreviewsStore } from './chat-previews';

/**
 * How many chats the list shows at first and adds on each scroll to the bottom.
 */
export const CHAT_LIST_PAGE_SIZE = 20;

/**
 * What the chat list shows out of the agent's chats: the unread filter, then a
 * window that grows on scroll (AC_02.01.02).
 *
 * The task feed arrives whole, so the window is not there to save a download. It
 * bounds the work done per listed chat: the previews seed one history request
 * for every chat they are given, and an agent with a couple of hundred chats
 * would otherwise open the page to a couple of hundred requests.
 */
export const useChatListStore = defineStore('chat-list', () => {
	const chatsStore = useChatsStore();
	const previewsStore = useChatPreviewsStore();

	const onlyUnread = ref(false);
	const visibleCount = ref(CHAT_LIST_PAGE_SIZE);

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

	const filteredTasks = computed(() =>
		isFilteringUnread.value
			? chatsStore.chatTaskList.filter((task) =>
					previewsStore.isUnread(task.thread?.id ?? ''),
				)
			: chatsStore.chatTaskList,
	);

	const visibleTasks = computed(() =>
		filteredTasks.value.slice(0, visibleCount.value),
	);

	const hasMore = computed(
		() => filteredTasks.value.length > visibleCount.value,
	);

	function loadMore() {
		if (hasMore.value) visibleCount.value += CHAT_LIST_PAGE_SIZE;
	}

	// a new filter is a new list: start it from the top, not from wherever the
	// previous one had been scrolled to
	function toggleOnlyUnread() {
		onlyUnread.value = !onlyUnread.value;
		visibleCount.value = CHAT_LIST_PAGE_SIZE;
	}

	/**
	 * The previews follow the window, not the whole list: a chat that scrolls in
	 * is seeded, one that falls out of it is forgotten. `sync` is idempotent, so
	 * the SDK mutating tasks in place and re-running this costs nothing.
	 */
	watch(
		() => visibleTasks.value.flatMap((task) => task.thread?.id ?? []),
		(threadIds) => previewsStore.sync(threadIds),
		{
			immediate: true,
		},
	);

	return {
		// state
		onlyUnread,

		// getters
		isUnreadFilterAvailable,
		isFilteringUnread,
		visibleTasks,
		hasMore,

		// actions
		loadMore,
		toggleOnlyUnread,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatListStore, import.meta.hot));
}
