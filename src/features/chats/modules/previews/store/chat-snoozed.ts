import {
	type SocketThreadTagsChangedEventPayload,
	ThreadTag,
} from '@webitel/chat-web-sdk';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, shallowRef } from 'vue';
import type { Task } from 'webitel-sdk';

import { threadsService } from '../../../api/chatSdk';
import { useChatsStore } from '../../../store/chats';

/** As many as one read can carry; snoozed threads are few, so this is one page. */
const LOAD_PAGE_SIZE = 100;

/**
 * The agent's snoozed chats. Snoozing lives only on the chat backend, as the
 * agent's own tag on the thread; the task feed the list is built from knows
 * nothing of it. So this keeps the set of snoozed thread ids and the Snoozed
 * tab is the listed chats whose thread is in it (ADR-0008).
 *
 * The set is read whole on start and after the chats socket was down, and kept
 * current in between from the socket's tag changes.
 */
export const useChatSnoozedStore = defineStore('chat-snoozed', () => {
	const chatsStore = useChatsStore();

	// reassigned, never mutated, so shallow reactivity is enough
	const threadIds = shallowRef<ReadonlySet<string>>(new Set());

	const isSnoozed = (threadId: string) => threadIds.value.has(threadId);

	// a snoozed thread with no task is not on the list at all
	const tasks = computed<Task[]>(() =>
		chatsStore.chatTaskList.filter((task) => isSnoozed(task.thread?.id ?? '')),
	);

	const count = computed(() => tasks.value.length);

	/**
	 * Reads every snoozed thread id and replaces what is held. A failed read
	 * keeps the old set: the socket still corrects it, and the next reconnect
	 * reads it again.
	 */
	async function load() {
		const loaded = new Set<string>();
		try {
			for (let page = 1; ; page += 1) {
				const result = await threadsService.fetchThreads({
					tags: [
						ThreadTag.Snoozed,
					],
					fields: [
						'id',
					],
					size: LOAD_PAGE_SIZE,
					page,
				});
				for (const thread of result.items) loaded.add(thread.id);
				if (!result.next) break;
			}
		} catch {
			return;
		}
		threadIds.value = loaded;
	}

	// the tags are the agent's full set on that thread, not a diff
	function receiveTagsChanged({
		threadId,
		tags,
	}: Pick<SocketThreadTagsChangedEventPayload, 'threadId' | 'tags'>) {
		const snoozed = tags.includes(ThreadTag.Snoozed);
		if (snoozed === isSnoozed(threadId)) return;

		const next = new Set(threadIds.value);
		if (snoozed) next.add(threadId);
		else next.delete(threadId);
		threadIds.value = next;
	}

	return {
		// state
		threadIds,

		// getters
		isSnoozed,
		tasks,
		count,

		// actions
		load,
		receiveTagsChanged,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatSnoozedStore, import.meta.hot));
}
