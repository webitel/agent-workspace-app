import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { useChatsStore } from '../../../store/chats';
import { ChatListTab } from '../enums/ChatListTab.enum';
import { matchesChatSearch } from '../scripts/matchesChatSearch';
import { useChatActiveStore } from './chat-active';
import { useChatPreviewsStore } from './chat-previews';
import { useChatSnoozedStore } from './chat-snoozed';

/** How many chats the list shows at first and adds on each scroll to the bottom. */
export const CHAT_LIST_PAGE_SIZE = 20;

/**
 * Which tab of the chat list is open and what it shows, with each tab's count
 * for its indicator (US_02.12): the tab's chats, narrowed by the search, in a
 * window that grows on scroll (AC_02.01.02). Also hands the agent's chats to the
 * previews, which keep a last message for each chat shown.
 *
 * The task feed arrives whole, so the window is not there to save a download. It
 * bounds the work done per shown chat: the previews read one history request for
 * each, and an agent with a couple of hundred chats would otherwise open the
 * page to a couple of hundred requests.
 */
export const useChatListStore = defineStore('chat-list', () => {
	const chatsStore = useChatsStore();
	const previewsStore = useChatPreviewsStore();
	const activeStore = useChatActiveStore();
	const snoozedStore = useChatSnoozedStore();

	const currentTab = ref<ChatListTab>(ChatListTab.Active);
	const query = ref('');
	const visibleCount = ref(CHAT_LIST_PAGE_SIZE);

	const tabTasks = computed(() =>
		currentTab.value === ChatListTab.Snoozed
			? snoozedStore.tasks
			: activeStore.tasks,
	);

	const matchingTasks = computed(() =>
		tabTasks.value.filter((task) => matchesChatSearch(task, query.value)),
	);

	const currentTasks = computed(() =>
		matchingTasks.value.slice(0, visibleCount.value),
	);

	const hasMore = computed(
		() => matchingTasks.value.length > visibleCount.value,
	);

	// the indicators count each tab's chats, not what the search or the unread
	// filter leaves of them
	const activeCount = computed(() => activeStore.count);
	const snoozedCount = computed(() => snoozedStore.count);
	const unreadCount = computed(() => activeStore.unreadCount);

	function loadMore() {
		if (hasMore.value) visibleCount.value += CHAT_LIST_PAGE_SIZE;
	}

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

	// a different tab, search or filter is a different list: start it from the top,
	// not from wherever the previous one had been scrolled to
	watch(
		[
			currentTab,
			query,
			() => activeStore.isFilteringUnread,
		],
		() => {
			visibleCount.value = CHAT_LIST_PAGE_SIZE;
		},
	);

	/**
	 * The previews are told every chat the agent has, so one that is hidden by the
	 * search, the filter or the window is still counted and kept; and the chats
	 * shown, whose last message is read. `sync` is idempotent, so the SDK mutating
	 * tasks in place and re-running this costs nothing.
	 */
	watch(
		[
			() => chatsStore.chatTaskList.flatMap((task) => task.thread?.id ?? []),
			() => currentTasks.value.flatMap((task) => task.thread?.id ?? []),
		],
		([listedIds, shownIds]) => previewsStore.sync(listedIds, shownIds),
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
		hasMore,
		activeCount,
		snoozedCount,
		unreadCount,

		// actions
		setTab,
		setQuery,
		toggleOnlyUnread,
		loadMore,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatListStore, import.meta.hot));
}
