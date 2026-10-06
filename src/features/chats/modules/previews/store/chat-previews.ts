import type { AccountModel } from '@webitel/chat-web-sdk';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, shallowRef } from 'vue';

import { messagesService } from '../../../api/chatSdk';
import { loadAccount } from '../../../api/loadAccount';
import type { IMessage } from '../../../types/ChatSession.types';
import { toLastMessage } from '../scripts/toLastMessage';
import type { LastMessage } from '../types/ChatPreview.types';

/**
 * How many of the newest messages the seed reads. Usually the first one is the
 * answer; the rest is slack for system notices, which are not the last message
 * and can sit on top.
 */
const SEED_PAGE_SIZE = 10;

/**
 * The last message of every chat in the list. Lives apart from the per-chat
 * session stores on purpose: a session exists only while its window is open and
 * is disposed with it, while a chat preview must show its last message for
 * every listed chat.
 *
 * A chat is seeded once with a single history request, then kept current from
 * the chats socket, so the list costs one request per chat rather than a
 * thread load.
 */
export const useChatPreviewsStore = defineStore('chat-previews', () => {
	// reassigned, never mutated, so shallow reactivity is enough
	const lastMessages = shallowRef<Record<string, LastMessage>>({});
	// the agent's own account, to tell their messages from the client's; null
	// until it loads, and the row then says nothing about who wrote the message
	const account = shallowRef<AccountModel | null>(null);
	// threads the list is showing: the socket carries every thread the agent is
	// in, and only these are worth keeping
	const tracked = new Set<string>();
	const seeded = new Set<string>();

	/**
	 * Unread message count per thread. Nothing fills it yet: the backend does not
	 * send one for a task (asked for on WS-35), and a count guessed on the client
	 * would read as fact (ADR-0001). It is the single place the real value will
	 * land, and the unread filter appears on its own once it holds anything.
	 */
	const unreadByThread = shallowRef<Record<string, number>>({});
	const hasUnreadData = computed(
		() => Object.keys(unreadByThread.value).length > 0,
	);

	function setUnreadCount(threadId: string, count: number) {
		unreadByThread.value = {
			...unreadByThread.value,
			[threadId]: count,
		};
	}

	const isUnread = (threadId: string) =>
		(unreadByThread.value[threadId] ?? 0) > 0;

	/**
	 * A message replaces the stored one when it is the same message (an edit or
	 * the echo of a send) or is not older. A slow seed answering after the socket
	 * delivered something newer, and the edit of an older message, both lose.
	 */
	function keepNewest(threadId: string, incoming: LastMessage) {
		const current = lastMessages.value[threadId];
		const isNewest =
			!current ||
			current.id === incoming.id ||
			(incoming.at ?? 0) >= (current.at ?? 0);
		if (!isNewest) return;

		lastMessages.value = {
			...lastMessages.value,
			[threadId]: incoming,
		};
	}

	function receiveMessage(message: IMessage) {
		const threadId = message.threadId;
		if (!threadId || !tracked.has(threadId)) return;

		const lastMessage = toLastMessage(message);
		if (lastMessage) keepNewest(threadId, lastMessage);
	}

	async function seed(threadId: string) {
		if (seeded.has(threadId)) return;
		seeded.add(threadId);

		try {
			const page = await messagesService.fetchMessageHistory(threadId, {
				size: SEED_PAGE_SIZE,
			});
			// newest first, so the first real message is the last one
			const lastMessage = page.items
				.map((message) => toLastMessage(message))
				.find((candidate) => candidate !== undefined);
			// the chat may have left the list while the request was in flight
			if (lastMessage && tracked.has(threadId))
				keepNewest(threadId, lastMessage);
		} catch {
			// the row shows what the task carries instead; try again the next time
			// the list changes rather than hammering a failing endpoint
			seeded.delete(threadId);
		}
	}

	/**
	 * Aligns the store with the chats the list shows: drops the ones that left
	 * and seeds the ones that arrived.
	 */
	function sync(threadIds: string[]) {
		const current = new Set(threadIds);

		if (!account.value)
			void loadAccount().then((value) => (account.value = value));

		for (const threadId of [
			...tracked,
		]) {
			if (current.has(threadId)) continue;
			tracked.delete(threadId);
			seeded.delete(threadId);
			const { [threadId]: _dropped, ...rest } = lastMessages.value;
			lastMessages.value = rest;
		}

		for (const threadId of current) {
			tracked.add(threadId);
			void seed(threadId);
		}
	}

	return {
		// state
		lastMessages,
		account,
		unreadByThread,

		// getters
		hasUnreadData,
		isUnread,

		// actions
		setUnreadCount,
		sync,
		receiveMessage,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useChatPreviewsStore, import.meta.hot),
	);
}
