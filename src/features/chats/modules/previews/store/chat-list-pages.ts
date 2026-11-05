import { shallowRef } from 'vue';

/**
 * A page that brings no chat the tab does not show yet is followed by the next
 * one, this many times at most, in case the backend keeps answering the same
 * chats (ADR-0012).
 */
const MAX_EMPTY_PAGES_IN_A_ROW = 3;

export interface ChatListPage {
	threadIds: string[];
	next: boolean;
}

/**
 * One tab of the chat list as read page by page, in the backend's order: the
 * thread ids of its rows and nothing else, since a row is drawn from its task
 * (ADR-0012). Chats moved in live (a new message, a snooze) sit among them, and
 * a later page skips the ones already shown.
 *
 * A plain factory rather than a store: the chat list keeps one for each tab.
 */
export function createChatListPages(
	loadPage: (page: number) => Promise<ChatListPage>,
) {
	// reassigned, never mutated, so shallow reactivity is enough
	const threadIds = shallowRef<string[]>([]);
	const hasNext = shallowRef(true);
	const isLoading = shallowRef(false);
	// the first page has answered at least once
	const isLoaded = shallowRef(false);
	// what the pages were read for changed while the tab was not shown
	const isStale = shallowRef(true);
	const error = shallowRef<unknown>(null);

	let page = 0;
	// bumped on every reset, so a page read for an older search, filter or
	// reload is dropped when it answers
	let generation = 0;

	function reset() {
		generation += 1;
		page = 0;
		threadIds.value = [];
		hasNext.value = true;
		isLoading.value = false;
		isLoaded.value = false;
		isStale.value = false;
		error.value = null;
	}

	async function loadNext(emptyInARow = 0): Promise<void> {
		if (isLoading.value || !hasNext.value) return;

		const requested = generation;
		isLoading.value = true;
		let added: string[] = [];
		try {
			const result = await loadPage(page + 1);
			if (requested !== generation) return;

			const shown = new Set(threadIds.value);
			added = result.threadIds.filter((threadId) => !shown.has(threadId));
			page += 1;
			threadIds.value = [
				...threadIds.value,
				...added,
			];
			hasNext.value = result.next;
			isLoaded.value = true;
			error.value = null;
		} catch (err) {
			// the rows stay, and the next try reads the same page again
			if (requested === generation) error.value = err;
			return;
		} finally {
			if (requested === generation) isLoading.value = false;
		}

		if (!added.length && emptyInARow < MAX_EMPTY_PAGES_IN_A_ROW)
			await loadNext(emptyInARow + 1);
	}

	/** Reads the tab afresh from its first page. */
	function loadFirst() {
		reset();
		return loadNext();
	}

	function markStale() {
		isStale.value = true;
	}

	/** Puts the chat first, moving it there when the tab already shows it. */
	function upsertTop(threadId: string) {
		threadIds.value = [
			threadId,
			...threadIds.value.filter((id) => id !== threadId),
		];
	}

	function remove(threadId: string) {
		if (!threadIds.value.includes(threadId)) return;
		threadIds.value = threadIds.value.filter((id) => id !== threadId);
	}

	const has = (threadId: string) => threadIds.value.includes(threadId);

	return {
		// state
		threadIds,
		hasNext,
		isLoading,
		isLoaded,
		isStale,
		error,

		// getters
		has,

		// actions
		loadFirst,
		loadNext,
		markStale,
		upsertTop,
		remove,
	};
}

export type ChatListPages = ReturnType<typeof createChatListPages>;
