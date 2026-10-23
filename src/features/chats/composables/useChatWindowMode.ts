import { type ComputedRef, computed, type Ref } from 'vue';

import { useChatsStore } from '../store/chats';

/**
 * What the chat window on `/chats/:threadId` shows (ADR-0009): `active` while a
 * task in the feed backs the thread, `closed` once none does, and `pending`
 * until the feed is ready to tell the two apart.
 */
export type ChatWindowMode = 'pending' | 'active' | 'closed';

export function useChatWindowMode(
	threadId: Ref<string>,
): ComputedRef<ChatWindowMode> {
	const chatsStore = useChatsStore();

	// the feed alone decides: a thread the agent left once and then rejoined is
	// in /threads/left too, and is an active chat only
	return computed(() => {
		// a deep-linked active chat must not flash as closed before the feed is back
		if (!chatsStore.isTaskFeedReady) return 'pending';
		return chatsStore.hasChatTask(threadId.value) ? 'active' : 'closed';
	});
}
