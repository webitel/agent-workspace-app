import { defineStore, getActivePinia } from 'pinia';
import { computed, ref, shallowRef } from 'vue';

import { threadsService } from '../api/chatSdk';
import type { IMessage, IThread } from '../types/ChatSession.types';

const storeId = (chatId: string) => `chat:${chatId}`;

const PAGE_SIZE = 30;

/**
 * Dynamic store factory — one isolated store per chat, namespaced by chatId.
 * Lifecycle is owned by the chats coordinator (open/close), NOT by components:
 * a minimized chat stays alive after its component unmounts.
 *
 * SDK class instances (IThread / IMessage carry methods) live in shallowRef so
 * Vue does not wrap them in deep reactive proxies — reassign to trigger updates.
 */
export function useChatSessionStore(chatId: string) {
	const useStore = defineStore(storeId(chatId), () => {
		const thread = shallowRef<IThread | null>(null);
		const messages = shallowRef<IMessage[]>([]);
		const isLoading = ref(false);
		const error = ref<unknown>(null);
		// nextCursor.id from the history response — keyset cursor to OLDER messages
		const olderCursor = ref<string | null>(null);
		const initialized = ref(false);

		const hasMore = computed(() => olderCursor.value !== null);

		// fetch thread meta + first (newest) page; idempotent across mounts
		async function load() {
			if (initialized.value || isLoading.value) return;
			isLoading.value = true;
			error.value = null;
			try {
				const t = await threadsService.fetchThread(chatId);
				const page = await t.fetchMessageHistory({ size: PAGE_SIZE });
				thread.value = t;
				messages.value = page.items;
				olderCursor.value = page.nextCursor?.id ?? null;
				initialized.value = true;
			} catch (e) {
				error.value = e;
			} finally {
				isLoading.value = false;
			}
		}

		// older page (infinite scroll up) — keyset pagination via cursorId
		async function loadMore() {
			if (!thread.value || !olderCursor.value || isLoading.value) return;
			isLoading.value = true;
			try {
				const page = await thread.value.fetchMessageHistory({
					size: PAGE_SIZE,
					cursorId: olderCursor.value,
					cursorBefore: false, // false -> older messages
				});
				// reassign (shallowRef) — prepend older history before existing
				messages.value = [...page.items, ...messages.value];
				olderCursor.value = page.nextCursor?.id ?? null;
			} catch (e) {
				error.value = e;
			} finally {
				isLoading.value = false;
			}
		}

		// new incoming message (from SDK socket, routed by coordinator)
		function appendMessage(msg: IMessage) {
			messages.value = [...messages.value, msg];
		}

		return {
			thread,
			messages,
			isLoading,
			error,
			olderCursor,
			hasMore,
			initialized,
			load,
			loadMore,
			appendMessage,
		};
	});

	return useStore();
}

/**
 * Full teardown. `$dispose()` stops the effect scope but leaves the entry in
 * pinia.state.value for setup stores — delete it manually or it leaks.
 */
export function disposeChatSession(chatId: string) {
	const store = useChatSessionStore(chatId);
	store.$dispose();
	const pinia = getActivePinia();
	if (pinia) delete pinia.state.value[storeId(chatId)];
}
