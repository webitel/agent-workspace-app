import { defineStore, getActivePinia } from 'pinia';
import { computed, ref, shallowRef } from 'vue';

import { threadsService } from '../../../api/chatSdk';
import type { ILeftThread, IMessage } from '../../../types/ChatSession.types';

const storeId = (threadId: string) => `closed-chat:${threadId}`;

const PAGE_SIZE = 30;

// Cache of store definitions, keyed by thread id, so repeated
// useClosedChatStore(id) calls reuse one defineStore wrapper.
const storeDefinitions = new Map<
	string,
	ReturnType<typeof createStoreDefinition>
>();

function createStoreDefinition(threadId: string) {
	return defineStore(storeId(threadId), () => {
		// shallowRef: SDK class instances carry methods — keep them out of deep proxies, reassign to update
		const thread = shallowRef<ILeftThread | null>(null);
		const messages = shallowRef<IMessage[]>([]);
		const isLoading = ref(false);
		const isNotFound = ref(false);
		const error = ref<unknown>(null);
		// keyset cursor to OLDER messages (response nextCursor.id)
		const olderCursor = ref<string | null>(null);
		const initialized = ref(false);
		// A thread handed over before the card loads (see seedClosedChat), used
		// by load() in place of the lookup when it gets no seed of its own.
		const seededThread = shallowRef<ILeftThread | null>(null);

		const hasMore = computed(() => olderCursor.value !== null);

		// Only the newest load may write, so a late answer for a superseded one
		// (the chat reopened, or seeded after a slower read began) cannot win.
		// loadMore reads belong to the load they started under.
		let latestRequest = 0;

		/**
		 * Reads the closed chat's thread and its newest history page. A thread
		 * the table already holds goes in as `seed`, or was seeded beforehand,
		 * saving the lookup. Once loaded, a closed chat does not change, so later
		 * calls do nothing.
		 */
		async function load(seed?: ILeftThread) {
			if (initialized.value) return;
			const request = ++latestRequest;
			isLoading.value = true;
			isNotFound.value = false;
			error.value = null;
			try {
				const leftThread =
					seed ??
					seededThread.value ??
					(await threadsService.findLeftThread(threadId));
				if (request !== latestRequest) return;
				if (!leftThread) {
					isNotFound.value = true;
					return;
				}
				const page = await leftThread.fetchMessageHistory({
					size: PAGE_SIZE,
				});
				if (request !== latestRequest) return;
				thread.value = leftThread;
				// API returns newest->oldest (DESC); the UI renders top->bottom with
				// newest at the bottom, so store oldest->newest (ASC)
				messages.value = [
					...page.items,
				].reverse();
				olderCursor.value = page.nextCursor?.id ?? null;
				initialized.value = true;
			} catch (err) {
				if (request !== latestRequest) return;
				error.value = err;
			} finally {
				if (request === latestRequest) isLoading.value = false;
			}
		}

		function holdSeed(leftThread: ILeftThread) {
			seededThread.value = leftThread;
		}

		async function loadMore() {
			if (!thread.value || !olderCursor.value || isLoading.value) return;
			const request = latestRequest;
			isLoading.value = true;
			try {
				const page = await thread.value.fetchMessageHistory({
					size: PAGE_SIZE,
					cursorId: olderCursor.value,
					cursorBefore: false, // false -> older direction
				});
				if (request !== latestRequest) return;
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
				if (request !== latestRequest) return;
				error.value = err;
			} finally {
				if (request === latestRequest) isLoading.value = false;
			}
		}

		return {
			thread,
			messages,
			isLoading,
			isNotFound,
			error,
			hasMore,
			holdSeed,
			load,
			loadMore,
		};
	});
}

// One isolated store per closed chat (namespaced by thread id). It never
// follows the socket: the agent has left, so nothing more reaches it.
export function useClosedChatStore(threadId: string) {
	let useStore = storeDefinitions.get(threadId);
	if (!useStore) {
		useStore = createStoreDefinition(threadId);
		storeDefinitions.set(threadId, useStore);
	}
	return useStore();
}

/**
 * Hands the table's thread to the closed chat's store, so the card, which
 * calls load() with no thread of its own, skips the lookup.
 */
export function seedClosedChat(thread: ILeftThread) {
	useClosedChatStore(thread.id).holdSeed(thread);
}

// $dispose() stops the scope but leaves state in pinia.state.value for setup
// stores — delete it manually or the chat's state leaks. Drop the cached
// definition too so a reopened chat gets a fresh store.
export function disposeClosedChat(threadId: string) {
	if (!storeDefinitions.has(threadId)) return;
	useClosedChatStore(threadId).$dispose();
	const pinia = getActivePinia();
	if (pinia) delete pinia.state.value[storeId(threadId)];
	storeDefinitions.delete(threadId);
}
