import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { useChatsStore } from '../../../store/chats';
import { useChatPreviewsStore } from './chat-previews';
import { useChatSnoozedStore } from './chat-snoozed';

/**
 * The Active tab's chats: every chat the agent has accepted and not snoozed,
 * counted for the tab's indicators, and the unread filter (AC_02.01.04). The
 * chats themselves belong to the task feed, which `chats` owns; which of them
 * the tab shows is read page by page in `chat-list`.
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
	 * The toggle exists once the first read of the unread chats has answered (see
	 * `chat-previews`): before that, "nothing is unread" would be a gap and not a
	 * fact, and the filter would empty the list for no reason.
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

	// the tab's indicator counts its chats, not what the unread filter leaves
	const count = computed(() => activeTasks.value.length);

	/**
	 * Zero until the unread chats have been read, so the indicator stays out of
	 * sight rather than claiming nothing is unread.
	 */
	const unreadCount = computed(() =>
		isUnreadFilterAvailable.value
			? activeTasks.value.filter(isUnread).length
			: 0,
	);

	function toggleOnlyUnread() {
		onlyUnread.value = !onlyUnread.value;
	}

	function setOnlyUnread(value: boolean) {
		onlyUnread.value = value;
	}

	return {
		// state
		onlyUnread,

		// getters
		isUnreadFilterAvailable,
		isFilteringUnread,
		count,
		unreadCount,

		// actions
		toggleOnlyUnread,
		setOnlyUnread,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatActiveStore, import.meta.hot));
}
