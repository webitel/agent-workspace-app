import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { useChatsStore } from '../../../store/chats';
import { ChatListTab } from '../enums/ChatListTab.enum';
import { useChatPreviewsStore } from './chat-previews';
import { useChatSnoozedStore } from './chat-snoozed';

/**
 * What the chat list shows: the Active tab's chats, all of them or the unread
 * ones when the filter is on (AC_02.01.04), or the Snoozed tab's. Also counts
 * each tab for its indicator (US_02.12). Also hands the agent's chats to the
 * previews, which keep a last message for each.
 *
 * Paging on scroll (AC_02.01.02) is deliberately not here yet; the list is every
 * active chat the task feed carries.
 */
export const useChatListStore = defineStore('chat-list', () => {
	const chatsStore = useChatsStore();
	const previewsStore = useChatPreviewsStore();
	const snoozedStore = useChatSnoozedStore();

	const currentTab = ref<ChatListTab>(ChatListTab.Active);
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

	// the unread filter narrows the Active tab only
	const currentTasks = computed(() =>
		currentTab.value === ChatListTab.Snoozed ? snoozedStore.tasks : tasks.value,
	);

	// the tab indicators count the tab's chats, not what the unread filter leaves
	const activeCount = computed(() => chatsStore.chatTaskList.length);
	const snoozedCount = computed(() => snoozedStore.count);

	/**
	 * Zero while there is no unread data, so the indicator stays out of sight
	 * rather than claiming nothing is unread.
	 */
	const unreadCount = computed(() =>
		isUnreadFilterAvailable.value
			? chatsStore.chatTaskList.filter((task) =>
					previewsStore.isUnread(task.thread?.id ?? ''),
				).length
			: 0,
	);

	function setTab(tab: ChatListTab) {
		currentTab.value = tab;
	}

	function toggleOnlyUnread() {
		onlyUnread.value = !onlyUnread.value;
	}

	/**
	 * The previews follow the agent's chats, not what the filter leaves showing: a
	 * chat the filter hides still has a last message to keep current, and
	 * forgetting it would read its history again the moment the filter is off.
	 * `sync` is idempotent, so the SDK mutating tasks in place and re-running this
	 * costs nothing.
	 */
	watch(
		() => chatsStore.chatTaskList.flatMap((task) => task.thread?.id ?? []),
		(threadIds) => previewsStore.sync(threadIds),
		{
			immediate: true,
		},
	);

	return {
		// state
		currentTab,
		onlyUnread,

		// getters
		isUnreadFilterAvailable,
		isFilteringUnread,
		tasks,
		currentTasks,
		activeCount,
		snoozedCount,
		unreadCount,

		// actions
		setTab,
		toggleOnlyUnread,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatListStore, import.meta.hot));
}
