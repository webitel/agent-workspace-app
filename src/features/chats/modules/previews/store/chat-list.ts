import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { useChatsStore } from '../../../store/chats';
import type { IMessage } from '../../../types/ChatSession.types';
import { fetchChatListPage } from '../api/fetchChatListPage';
import { ChatListTab } from '../enums/ChatListTab.enum';
import { useChatActiveStore } from './chat-active';
import { createChatListPages } from './chat-list-pages';
import { useChatPreviewsStore } from './chat-previews';
import { useChatSnoozedStore } from './chat-snoozed';

/**
 * Which tab of the chat list is open and what it shows, with each tab's count
 * for its indicator (US_02.12). Which chats are listed is the task feed's to
 * say; which of them a tab shows, in what order, is read from the chat backend
 * a page at a time and kept in order from the sockets. Also hands the
 * agent's chats to the previews, which keep a last message for each.
 */
export const useChatListStore = defineStore('chat-list', () => {
	const chatsStore = useChatsStore();
	const previewsStore = useChatPreviewsStore();
	const activeStore = useChatActiveStore();
	const snoozedStore = useChatSnoozedStore();

	const currentTab = ref<ChatListTab>(ChatListTab.Active);
	const query = ref('');

	const listedThreadIds = computed(() =>
		chatsStore.chatTaskList.flatMap((task) => task.thread?.id ?? []),
	);
	const listed = computed(() => new Set(listedThreadIds.value));

	/**
	 * One page of a tab. Its rows bring their last message and unread count to
	 * the previews; a row whose task left the feed while the page was in flight
	 * is dropped.
	 */
	const loadPageOf = (tab: ChatListTab) => async (page: number) => {
		const { threads, next } = await fetchChatListPage({
			tab,
			threadIds: listedThreadIds.value,
			query: query.value,
			onlyUnread: activeStore.isFilteringUnread,
			page,
		});
		for (const thread of threads) previewsStore.receiveThread(thread);
		return {
			threadIds: threads
				.map((thread) => thread.id)
				.filter((threadId) => listed.value.has(threadId)),
			next,
		};
	};

	// kept out of the store's state, where pinia would unwrap their refs
	const activePages = createChatListPages(loadPageOf(ChatListTab.Active));
	const snoozedPages = createChatListPages(loadPageOf(ChatListTab.Snoozed));
	const pagesOf = (tab: ChatListTab) =>
		tab === ChatListTab.Snoozed ? snoozedPages : activePages;
	const currentPages = computed(() => pagesOf(currentTab.value));

	const currentTasks = computed(() =>
		currentPages.value.threadIds.value.flatMap(
			(threadId) => chatsStore.getTaskByThreadId(threadId) ?? [],
		),
	);
	const hasNext = computed(() => currentPages.value.hasNext.value);
	const isLoading = computed(() => currentPages.value.isLoading.value);
	const loadError = computed(() => currentPages.value.error.value);

	// the indicators count each tab's chats, not what the pages have read so far
	// or the search and the unread filter leave of them
	const activeCount = computed(() => activeStore.count);
	const snoozedCount = computed(() => snoozedStore.count);
	const unreadCount = computed(() => activeStore.unreadCount);

	/**
	 * Reads the open tab again from its first page; the other one is read when it
	 * is next opened. The pages are scoped to the listed chats, so nothing is read
	 * before the task feed has arrived.
	 */
	function reload() {
		activePages.markStale();
		snoozedPages.markStale();
		if (chatsStore.isTaskFeedReady) void currentPages.value.loadFirst();
	}

	function loadNext() {
		return currentPages.value.loadNext();
	}

	function setTab(tab: ChatListTab) {
		currentTab.value = tab;
		if (currentPages.value.isStale.value && chatsStore.isTaskFeedReady)
			void currentPages.value.loadFirst();
	}

	function setQuery(value: string) {
		const trimmed = value.trim();
		if (trimmed === query.value) return;
		query.value = trimmed;
		reload();
	}

	/**
	 * On the Snoozed tab the unread filter hands the agent over to the Active tab
	 * with it on (AC_02.02.04); on the Active tab it switches. Either way Active
	 * is read again, as the backend narrows it.
	 */
	function toggleOnlyUnread() {
		if (currentTab.value === ChatListTab.Snoozed) {
			activeStore.setOnlyUnread(true);
			activePages.markStale();
			setTab(ChatListTab.Active);
			return;
		}
		activeStore.toggleOnlyUnread();
		void activePages.loadFirst();
	}

	/**
	 * Whether a chat no page has brought may be put on Active live. The backend
	 * searches, so a chat cannot be told to match while a search is on; with the
	 * unread filter on, only an unread chat belongs.
	 */
	const canInsertLive = (threadId: string) =>
		!query.value &&
		(!activeStore.isFilteringUnread || previewsStore.isUnread(threadId));

	function showOnActive(threadId: string) {
		if (!activePages.isLoaded.value) return;
		if (activePages.has(threadId) || canInsertLive(threadId))
			activePages.upsertTop(threadId);
	}

	/**
	 * A message moves its chat to the top of Active, as a fresh read sorted by
	 * activity would. The agent's own messages count too; system
	 * notices do not. A snoozed chat stays put: if the message unsnoozes it, the
	 * tags change moves it.
	 */
	function receiveMessage(message: IMessage) {
		const threadId = message.threadId;
		if (!threadId || message.system) return;
		if (!listed.value.has(threadId) || snoozedStore.isSnoozed(threadId)) return;
		showOnActive(threadId);
	}

	/**
	 * A chat the agent has just accepted is read on its own, for its last message
	 * and unread count, and put at the top of Active. When the read fails it is
	 * shown all the same, with its last message read from its history.
	 */
	async function showAccepted(threadId: string) {
		try {
			const { threads } = await fetchChatListPage({
				tab: ChatListTab.Active,
				threadIds: [
					threadId,
				],
				query: '',
				onlyUnread: false,
				page: 1,
			});
			for (const thread of threads) previewsStore.receiveThread(thread);
			if (!threads.length) void previewsStore.seed(threadId);
		} catch {
			void previewsStore.seed(threadId);
		}
		// the chat may have left, or been snoozed, while the read was in flight
		if (!listed.value.has(threadId) || snoozedStore.isSnoozed(threadId)) return;
		showOnActive(threadId);
	}

	/**
	 * The previews follow the agent's chats, not what the pages show: a chat on a
	 * page not read yet still has a last message to keep current. The tabs follow
	 * the feed too: a chat that leaves it leaves both, and one the agent accepts
	 * joins Active. The first fill is the first page, not this.
	 */
	watch(
		listedThreadIds,
		(threadIds, previous) => {
			previewsStore.sync(threadIds);
			if (!previous) return;

			const before = new Set(previous);
			const after = new Set(threadIds);
			for (const threadId of previous) {
				if (after.has(threadId)) continue;
				activePages.remove(threadId);
				snoozedPages.remove(threadId);
			}
			if (!activePages.isLoaded.value) return;
			for (const threadId of threadIds) {
				if (!before.has(threadId)) void showAccepted(threadId);
			}
		},
		{
			immediate: true,
		},
	);

	/**
	 * A chat that is snoozed leaves Active for the top of Snoozed, and one that is
	 * unsnoozed goes back, whether the agent did it, the backend refused it, or a
	 * client's message woke it (AC_02.02.05).
	 */
	watch(
		() => snoozedStore.threadIds,
		(snoozed, previous) => {
			for (const threadId of snoozed) {
				if (previous.has(threadId) || !listed.value.has(threadId)) continue;
				activePages.remove(threadId);
				if (snoozedPages.isLoaded.value && !query.value)
					snoozedPages.upsertTop(threadId);
			}
			for (const threadId of previous) {
				if (snoozed.has(threadId) || !listed.value.has(threadId)) continue;
				snoozedPages.remove(threadId);
				showOnActive(threadId);
			}
		},
	);

	watch(
		() => chatsStore.isTaskFeedReady,
		(isReady) => {
			if (isReady) reload();
		},
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
		hasNext,
		isLoading,
		loadError,
		activeCount,
		snoozedCount,
		unreadCount,

		// actions
		setTab,
		setQuery,
		toggleOnlyUnread,
		loadNext,
		reload,
		receiveMessage,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatListStore, import.meta.hot));
}
