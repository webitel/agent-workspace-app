import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, shallowRef } from 'vue';

import { messagesService, threadsService } from '../../../api/chatSdk';
import { isSelfContact } from '../../../scripts/isSelfContact';
import { useChatAccountStore } from '../../../store/chat-account';
import type { IMessage } from '../../../types/ChatSession.types';
import { toLastMessage } from '../scripts/toLastMessage';
import type { LastMessage } from '../types/ChatPreview.types';

/**
 * How many of the newest messages the seed reads. Usually the first one is the
 * answer; the rest is slack for system notices, which are not the last message
 * and can sit on top.
 */
const SEED_PAGE_SIZE = 10;

/** Unread chats are few, so one read of them is as many as the backend allows. */
const UNREAD_PAGE_SIZE = 100;

/**
 * What the chat list knows about each chat besides the task: its last message
 * and how many messages the agent has not seen. Lives apart from the per-chat
 * session stores on purpose: a session exists only for a chat that was opened
 * (ADR-0007), while a chat preview must show its last message for every listed
 * chat, opened or not.
 *
 * A chat's last message is seeded once with a single history request, for the
 * chats the list is showing, then kept current from the chats socket, so the
 * list costs one request per shown chat rather than a thread load. Its unread
 * count is read once for every chat that has any, and kept from the socket
 * (ADR-0011).
 */
export const useChatPreviewsStore = defineStore('chat-previews', () => {
	// reassigned, never mutated, so shallow reactivity is enough
	const lastMessages = shallowRef<Record<string, LastMessage>>({});
	const accountStore = useChatAccountStore();
	// every thread the list holds, shown or not: the socket carries every thread
	// the agent is in, and only these are worth counting
	const listed = new Set<string>();
	// the listed threads whose last message is kept: the ones that were shown
	const tracked = new Set<string>();
	const seeded = new Set<string>();
	// the newest message counted per thread, so an edit or the echo of a message
	// already counted is not counted again
	const lastCounted = new Map<string, string>();

	/**
	 * Unread message count per listed thread, from the backend: every thread with
	 * unread messages is read once, and the socket keeps the counts current after
	 * that. Nothing here is worked out from guesses (ADR-0001): a message counts
	 * only when someone else wrote it and the agent's account says so.
	 */
	const unreadByThread = shallowRef<Record<string, number>>({});
	// the first read has answered, so "nothing unread" is a fact and not a gap
	const isUnreadLoaded = shallowRef(false);
	const hasUnreadData = computed(() => isUnreadLoaded.value);

	function setUnreadCount(threadId: string, count: number) {
		if ((unreadByThread.value[threadId] ?? 0) === count) return;
		unreadByThread.value = {
			...unreadByThread.value,
			[threadId]: count,
		};
	}

	/**
	 * Reads every thread that has unread messages and replaces the counts. A
	 * failed read keeps what is held: the socket still counts, and the next
	 * reconnect reads again.
	 */
	async function loadUnread() {
		const found: Record<string, number> = {};
		try {
			for (let page = 1; ; page += 1) {
				const result = await threadsService.fetchThreads({
					unread: true,
					size: UNREAD_PAGE_SIZE,
					page,
				});
				for (const thread of result.items) {
					found[thread.id] = Math.max(thread.unreadCount ?? 0, 1);
				}
				if (!result.next) break;
			}
		} catch {
			return;
		}
		unreadByThread.value = found;
		isUnreadLoaded.value = true;
	}

	/**
	 * The agent has seen the chat's messages. The backend counts them read as the
	 * thread view marks them, so the count is cleared here at once rather than
	 * read again.
	 */
	function markRead(threadId: string) {
		setUnreadCount(threadId, 0);
	}

	function countUnread(threadId: string, lastMessage: LastMessage) {
		if (lastCounted.get(threadId) === lastMessage.id) return;
		lastCounted.set(threadId, lastMessage.id);

		const account = accountStore.account;
		if (!account?.contact?.sub) return;
		if (isSelfContact(lastMessage.senderContact, account)) return;

		setUnreadCount(threadId, (unreadByThread.value[threadId] ?? 0) + 1);
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
		if (!threadId) return;

		const lastMessage = toLastMessage(message);
		if (!lastMessage) return;

		if (listed.has(threadId)) countUnread(threadId, lastMessage);
		if (tracked.has(threadId)) keepNewest(threadId, lastMessage);
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
	 * Aligns the store with the list. `listedIds` is every chat the agent has: the
	 * ones that left are forgotten, and the rest are counted. `shownIds` is the
	 * chats the list is showing now, whose last message is read when it is not
	 * held yet. A chat that stops being shown keeps its message, so showing it
	 * again does not read it again.
	 */
	function sync(listedIds: string[], shownIds: string[]) {
		const current = new Set(listedIds);

		for (const threadId of [
			...listed,
		]) {
			if (current.has(threadId)) continue;
			listed.delete(threadId);
			tracked.delete(threadId);
			seeded.delete(threadId);
			lastCounted.delete(threadId);
			const { [threadId]: _dropped, ...rest } = lastMessages.value;
			lastMessages.value = rest;
			const { [threadId]: _unread, ...counts } = unreadByThread.value;
			unreadByThread.value = counts;
		}

		for (const threadId of current) listed.add(threadId);

		for (const threadId of shownIds) {
			if (!current.has(threadId)) continue;
			tracked.add(threadId);
			void seed(threadId);
		}
	}

	/**
	 * Reads every listed chat's last message again, for when the chats socket
	 * was down and may have missed some. `keepNewest` settles a read racing the
	 * socket, as it does for the first seed.
	 */
	function reseed() {
		seeded.clear();
		for (const threadId of tracked) void seed(threadId);
	}

	return {
		// state
		lastMessages,
		unreadByThread,

		// getters
		hasUnreadData,
		isUnread,

		// actions
		setUnreadCount,
		loadUnread,
		markRead,
		sync,
		receiveMessage,
		reseed,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useChatPreviewsStore, import.meta.hot),
	);
}
