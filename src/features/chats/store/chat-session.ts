import { defineStore, getActivePinia } from 'pinia';
import { computed, ref, shallowRef } from 'vue';

import { threadsService } from '../api/chatSdk';
import type { IMessage, IThread } from '../types/ChatSession.types';

const storeId = (chatId: string) => `chat:${chatId}`;

const PAGE_SIZE = 30;

// One isolated store per chat (namespaced by chatId). Coordinator owns its
// lifecycle, not components — a minimized chat outlives its unmounted component.
export function useChatSessionStore(chatId: string) {
	const useStore = defineStore(storeId(chatId), () => {
		// shallowRef: SDK class instances carry methods — keep them out of deep proxies, reassign to update
		const thread = shallowRef<IThread | null>(null);
		const messages = shallowRef<IMessage[]>([]);
		const isLoading = ref(false);
		const error = ref<unknown>(null);
		// keyset cursor to OLDER messages (response nextCursor.id)
		const olderCursor = ref<string | null>(null);
		const initialized = ref(false);

		const hasMore = computed(() => olderCursor.value !== null);

		async function load() {
			if (initialized.value || isLoading.value) return;
			isLoading.value = true;
			error.value = null;
			try {
				const fetchedThread = await threadsService.fetchThread(chatId);
				const page = await fetchedThread.fetchMessageHistory({
					size: PAGE_SIZE,
				});
				thread.value = fetchedThread;
				messages.value = page.items;
				olderCursor.value = page.nextCursor?.id ?? null;
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
				messages.value = [
					...page.items,
					...messages.value,
				];
				olderCursor.value = page.nextCursor?.id ?? null;
			} catch (err) {
				error.value = err;
			} finally {
				isLoading.value = false;
			}
		}

		function appendMessage(message: IMessage) {
			messages.value = [
				...messages.value,
				message,
			];
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

// $dispose() stops the scope but leaves state in pinia.state.value for setup
// stores — delete it manually or the chat's state leaks.
export function disposeChatSession(chatId: string) {
	const store = useChatSessionStore(chatId);
	store.$dispose();
	const pinia = getActivePinia();
	if (pinia) delete pinia.state.value[storeId(chatId)];
}
