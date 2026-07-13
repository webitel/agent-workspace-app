import { MessageAttachmentType } from '@webitel/chat-web-sdk';
import { defineStore, getActivePinia } from 'pinia';
import { computed, ref, shallowRef } from 'vue';

import { threadsService } from '../api/chatSdk';
import type { IMessage, IThread } from '../types/ChatSession.types';

const storeId = (chatId: string) => `chat:${chatId}`;

const PAGE_SIZE = 30;

// Cache of store definitions so repeated useChatSessionStore(id) calls (e.g.
// coordinator + component) reuse one defineStore wrapper, not a fresh one each time.
const storeDefinitions = new Map<
	string,
	ReturnType<typeof createStoreDefinition>
>();

function createStoreDefinition(chatId: string) {
	return defineStore(storeId(chatId), () => {
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
			initialized,
			load,
			loadMore,
			appendMessage,
			sendText,
			sendFiles,
		};
	});
}

// One isolated store per chat (namespaced by chatId). Coordinator owns its
// lifecycle, not components — a minimized chat outlives its unmounted component.
export function useChatSessionStore(chatId: string) {
	const id = storeId(chatId);
	let useStore = storeDefinitions.get(id);
	if (!useStore) {
		useStore = createStoreDefinition(chatId);
		storeDefinitions.set(id, useStore);
	}
	return useStore();
}

// $dispose() stops the scope but leaves state in pinia.state.value for setup
// stores — delete it manually or the chat's state leaks. Drop the cached
// definition too so a reopened chat gets a fresh store, not a stale wrapper.
export function disposeChatSession(chatId: string) {
	const id = storeId(chatId);
	useChatSessionStore(chatId).$dispose();
	const pinia = getActivePinia();
	if (pinia) delete pinia.state.value[id];
	storeDefinitions.delete(id);
}
