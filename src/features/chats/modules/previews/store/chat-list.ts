import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { useChatsStore } from '../../../store/chats';
import { useChatPreviewsStore } from './chat-previews';

/**
 * What the chat list shows out of the agent's chats: all of them, or the unread
 * ones when the filter is on (AC_02.01.04). Also what the previews are told to
 * keep a last message for.
 *
 * Paging on scroll (AC_02.01.02) is deliberately not here yet; the list is every
 * active chat the task feed carries.
 */
export const useChatListStore = defineStore('chat-list', () => {
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

	const tasks = computed(() =>
		isFilteringUnread.value
			? chatsStore.chatTaskList.filter((task) =>
					previewsStore.isUnread(task.thread?.id ?? ''),
				)
			: chatsStore.chatTaskList,
	);

	function toggleOnlyUnread() {
		onlyUnread.value = !onlyUnread.value;
	}

	/**
	 * The previews follow the list: a chat that joins is seeded, one that leaves
	 * is forgotten. `sync` is idempotent, so the SDK mutating tasks in place and
	 * re-running this costs nothing.
	 */
	watch(
		() => tasks.value.flatMap((task) => task.thread?.id ?? []),
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
		tasks,

		// actions
		toggleOnlyUnread,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatListStore, import.meta.hot));
}
