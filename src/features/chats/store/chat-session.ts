import { MessageAttachmentType } from '@webitel/chat-web-sdk';
import { defineStore, getActivePinia } from 'pinia';
import { computed, ref, shallowRef } from 'vue';

import { threadsService } from '../api/chatSdk';
import { findSelfMemberId } from '../scripts/findSelfMemberId';
import { mergeMessages } from '../scripts/mergeMessages';
import type {
	IMessage,
	IThread,
	MessageHistorySearchResult,
} from '../types/ChatSession.types';
import { useChatAccountStore } from './chat-account';
import { disposeChatVariables } from './chat-variables';

const storeId = (chatId: string) => `chat:${chatId}`;

const PAGE_SIZE = 30;

// Cache of store definitions, keyed by chat id, so repeated
// useChatSessionStore(id) calls (e.g. coordinator + component) reuse one
// defineStore wrapper, not a fresh one each time. It is also the registry of
// sessions: a chat has a session exactly while it has an entry here.
const storeDefinitions = new Map<
	string,
	ReturnType<typeof createStoreDefinition>
>();

function createStoreDefinition(chatId: string) {
	return defineStore(storeId(chatId), () => {
		// shallowRef: SDK class instances carry methods — keep them out of deep proxies, reassign to update
		const thread = shallowRef<IThread | null>(null);
		const messages = shallowRef<IMessage[]>([]);
		const accountStore = useChatAccountStore();
		// the operator's own member in this thread, for delivery ticks
		const selfMemberId = computed(() =>
			findSelfMemberId(thread.value, accountStore.account),
		);
		const isLoading = ref(false);
		const error = ref<unknown>(null);
		// keyset cursor to OLDER messages (response nextCursor.id)
		const olderCursor = ref<string | null>(null);
		const initialized = ref(false);

		const hasMore = computed(() => olderCursor.value !== null);

		/**
		 * Puts the newest history page into the session. `knownBefore` holds the
		 * ids the session had when the read started; anything else in `messages`
		 * arrived over the socket meanwhile and wins over the page's copy, which
		 * may predate it.
		 *
		 * A page that overlaps the history is merged into it, keeping the older
		 * pages already read. One that does not means more than a page was
		 * missed, so it replaces the history and the older cursor starts again
		 * from it.
		 */
		function applyNewestPage(
			page: MessageHistorySearchResult,
			knownBefore: ReadonlySet<string>,
		) {
			// API returns newest->oldest (DESC); the UI renders top->bottom with
			// newest at the bottom, so store oldest->newest (ASC)
			const newest = [
				...page.items,
			].reverse();
			const arrived = messages.value.filter(
				(message) => !knownBefore.has(message.id),
			);

			if (newest.some((message) => knownBefore.has(message.id))) {
				messages.value = mergeMessages(
					mergeMessages(messages.value, newest),
					arrived,
				);
				return;
			}

			messages.value = mergeMessages(newest, arrived);
			olderCursor.value = page.nextCursor?.id ?? null;
		}

		async function load() {
			if (initialized.value || isLoading.value) return;
			isLoading.value = true;
			error.value = null;
			const knownBefore = new Set(messages.value.map((message) => message.id));
			try {
				const fetchedThread = await threadsService.fetchThread(chatId);
				const page = await fetchedThread.fetchMessageHistory({
					size: PAGE_SIZE,
				});
				thread.value = fetchedThread;
				applyNewestPage(page, knownBefore);
				initialized.value = true;
			} catch (err) {
				error.value = err;
			} finally {
				isLoading.value = false;
			}
		}

		async function loadMore() {
			if (!thread.value || !olderCursor.value || isLoading.value) return;
			isLoading.value = true;
			try {
				const page = await thread.value.fetchMessageHistory({
					size: PAGE_SIZE,
					cursorId: olderCursor.value,
					cursorBefore: false, // false -> older direction
				});
				// Older page is also DESC; reverse to ASC, then prepend the whole
				// (older) block ahead of the messages already in view.
				messages.value = [
					...[
						...page.items,
					].reverse(),
					...messages.value,
				];
				olderCursor.value = page.nextCursor?.id ?? null;
			} catch (err) {
				error.value = err;
			} finally {
				isLoading.value = false;
			}
		}

		/**
		 * Re-reads the thread alone, for a session shown again: the socket kept
		 * its history current, but read states and delivery ticks come from the
		 * thread. A failed read leaves the last thread on screen.
		 */
		async function refreshThread() {
			if (!initialized.value) return;
			try {
				thread.value = await threadsService.fetchThread(chatId);
			} catch (err) {
				error.value = err;
			}
		}

		/**
		 * Brings a loaded session up to date after the chats socket was down and
		 * may have missed messages: the thread and the newest page are read
		 * again. A failed read leaves what is on screen.
		 */
		async function catchUp() {
			if (!initialized.value) return;
			const knownBefore = new Set(messages.value.map((message) => message.id));
			try {
				const fetchedThread = await threadsService.fetchThread(chatId);
				const page = await fetchedThread.fetchMessageHistory({
					size: PAGE_SIZE,
				});
				thread.value = fetchedThread;
				applyNewestPage(page, knownBefore);
			} catch (err) {
				error.value = err;
			}
		}

		function appendMessage(message: IMessage) {
			messages.value = [
				...messages.value,
				message,
			];
		}

		// Socket entry point: a live messageEvent for this thread. Replaces an
		// existing message by id (edits, and the echo of our own send), otherwise
		// appends. Ignores foreign threads defensively — the coordinator already
		// routes by threadId, but the payload may carry an unexpected one.
		function receiveMessage(message: IMessage) {
			if (message.threadId && message.threadId !== chatId) return;
			const isKnown = messages.value.some(
				(existing) => existing.id === message.id,
			);
			if (isKnown) {
				messages.value = messages.value.map((existing) =>
					existing.id === message.id ? message : existing,
				);
			} else {
				appendMessage(message);
			}
		}

		async function sendText(text: string) {
			const body = text.trim();
			if (!thread.value || !body) return;
			await thread.value.sendMessage({
				body,
			});
		}

		async function sendFiles(files: File[], body?: string) {
			if (!thread.value || files.length === 0) return;
			// The SDK tags one attachment kind per send; treat the batch as images
			// only when every file is an image, otherwise send them as documents.
			const type = files.every((file) => file.type.startsWith('image/'))
				? MessageAttachmentType.Images
				: MessageAttachmentType.Documents;
			await thread.value.sendMessage({
				body,
				attachments: {
					type,
					files,
				},
			});
		}

		return {
			thread,
			messages,
			isLoading,
			error,
			olderCursor,
			hasMore,
			selfMemberId,
			initialized,
			load,
			loadMore,
			refreshThread,
			catchUp,
			appendMessage,
			receiveMessage,
			sendText,
			sendFiles,
		};
	});
}

// One isolated store per chat (namespaced by chatId). Coordinator owns its
// lifecycle, not components — a minimized chat outlives its unmounted component,
// and a listed chat's session outlives its window (ADR-0007).
export function useChatSessionStore(chatId: string) {
	let useStore = storeDefinitions.get(chatId);
	if (!useStore) {
		useStore = createStoreDefinition(chatId);
		storeDefinitions.set(chatId, useStore);
	}
	return useStore();
}

/** Whether a chat has a session, without creating one. */
export function hasChatSession(chatId: string) {
	return storeDefinitions.has(chatId);
}

/** Every chat that has a session. */
export function chatSessionIds() {
	return [
		...storeDefinitions.keys(),
	];
}

// $dispose() stops the scope but leaves state in pinia.state.value for setup
// stores — delete it manually or the chat's state leaks. Drop the cached
// definition too so a reopened chat gets a fresh store, not a stale wrapper.
export function disposeChatSession(chatId: string) {
	useChatSessionStore(chatId).$dispose();
	disposeChatVariables(chatId);
	const pinia = getActivePinia();
	if (pinia) delete pinia.state.value[storeId(chatId)];
	storeDefinitions.delete(chatId);
}

/**
 * Disposes every session whose chat is not in `keep`. Which chats keep one is
 * the coordinator's call (ADR-0007); this only carries it out.
 */
export function retainChatSessions(keep: ReadonlySet<string>) {
	for (const chatId of chatSessionIds()) {
		if (!keep.has(chatId)) disposeChatSession(chatId);
	}
}
