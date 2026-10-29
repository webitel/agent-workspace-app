import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { useChatsStore } from '../../../store/chats';
import { ChatListTab } from '../enums/ChatListTab.enum';
import { matchesChatSearch } from '../scripts/matchesChatSearch';
import { useChatActiveStore } from './chat-active';
import { useChatPreviewsStore } from './chat-previews';
import { useChatSnoozedStore } from './chat-snoozed';

/**
 * Which tab of the chat list is open and what it shows, with each tab's count
 * for its indicator (US_02.12): the tab's chats, narrowed by the search. Also
 * hands the agent's chats to the previews, which keep a last message for each.
 */
export const useChatListStore = defineStore('chat-list', () => {
	const chatsStore = useChatsStore();
	const previewsStore = useChatPreviewsStore();
	const activeStore = useChatActiveStore();
	const snoozedStore = useChatSnoozedStore();

	const currentTab = ref<ChatListTab>(ChatListTab.Active);
	const query = ref('');

	const tabTasks = computed(() =>
		currentTab.value === ChatListTab.Snoozed
			? snoozedStore.tasks
			: activeStore.tasks,
	);

	const currentTasks = computed(() =>
		tabTasks.value.filter((task) => matchesChatSearch(task, query.value)),
	);

	// the indicators count each tab's chats, not what the search or the unread
	// filter leaves of them
	const activeCount = computed(() => activeStore.count);
	const snoozedCount = computed(() => snoozedStore.count);
	const unreadCount = computed(() => activeStore.unreadCount);

	function setTab(tab: ChatListTab) {
		currentTab.value = tab;
	}

	function setQuery(value: string) {
		query.value = value.trim();
	}

	/**
	 * On the Snoozed tab the unread filter hands the agent over to the Active tab
	 * with it on (AC_02.02.04); on the Active tab it switches.
	 */
	function toggleOnlyUnread() {
		if (currentTab.value === ChatListTab.Snoozed) {
			currentTab.value = ChatListTab.Active;
			activeStore.setOnlyUnread(true);
			return;
		}
		activeStore.toggleOnlyUnread();
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
		query,

		// getters
		currentTasks,
		activeCount,
		snoozedCount,
		unreadCount,

		// actions
		setTab,
		setQuery,
		toggleOnlyUnread,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatListStore, import.meta.hot));
}
