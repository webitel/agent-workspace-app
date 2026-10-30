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

	// only contact-center chats snooze (WS-57): an internal chat has no task,
	// though the backend would tag its thread all the same
	const canSnooze = (threadId: string) =>
		Boolean(chatsStore.getTaskByThreadId(threadId)) && !isSnoozed(threadId);

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

	function setSnoozed(threadId: string, snoozed: boolean) {
		if (snoozed === isSnoozed(threadId)) return;

		const next = new Set(threadIds.value);
		if (snoozed) next.add(threadId);
		else next.delete(threadId);
		threadIds.value = next;
	}

	// the tags are the agent's full set on that thread, not a diff
	function receiveTagsChanged({
		threadId,
		tags,
	}: Pick<SocketThreadTagsChangedEventPayload, 'threadId' | 'tags'>) {
		setSnoozed(threadId, tags.includes(ThreadTag.Snoozed));
	}

	/**
	 * Moves the chat to Snoozed at once and asks the backend after
	 * (AC_03.02.03); a refusal moves it back and is rethrown for the caller to
	 * report. The tags event that follows a success changes nothing.
	 */
	async function snooze(threadId: string) {
		if (isSnoozed(threadId)) return;

		setSnoozed(threadId, true);
		try {
			await threadsService.snooze(threadId);
		} catch (err) {
			setSnoozed(threadId, false);
			throw err;
		}
	}

	return {
		// state
		threadIds,

		// getters
		isSnoozed,
		canSnooze,
		tasks,
		count,

		// actions
		load,
		receiveTagsChanged,
		snooze,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatSnoozedStore, import.meta.hot));
}
