import { ref, shallowRef } from 'vue';

import { defineKeyedStore } from '../../../app/scripts/defineKeyedStore';
import { threadsService } from '../api/chatSdk';
import type { ThreadVariablesModel } from '../types/ChatSession.types';

const chatVariables = defineKeyedStore('chat-variables', (chatId: string) => {
	// reassigned wholesale on every refresh, never patched
	const variables = shallowRef<NonNullable<ThreadVariablesModel['variables']>>(
		{},
	);
	const error = ref<unknown>(null);
	const isLoading = ref(false);
	// whether any request has settled yet: tells a first load from a refetch
	const isLoaded = ref(false);

	// Tab switches can fire refreshes faster than the server answers; only the
	// newest request may write, so an older answer landing late cannot win.
	let latestRequest = 0;

	async function refresh() {
		const request = ++latestRequest;
		isLoading.value = true;
		error.value = null;
		try {
			const response = await threadsService.locateVariables(chatId);
			if (request !== latestRequest) return;
			variables.value = response.variables ?? {};
		} catch (err) {
			if (request !== latestRequest) return;
			const status = (
				err as {
					response?: {
						status?: number;
					};
				}
			).response?.status;
			if (status === 404 || status === 403) {
				// No variables to read is not a failure, and an agent role without
				// access to the endpoint can never succeed on retry — the tab falls
				// back to the task's variables alone.
				if (status === 403) {
					console.warn(
						`[chat ${chatId}] thread variables are not readable by this role`,
					);
				}
				variables.value = {};
				return;
			}
			// a failed refresh leaves the last good variables on screen
			error.value = err;
		} finally {
			if (request === latestRequest) {
				isLoading.value = false;
				isLoaded.value = true;
			}
		}
	}

	return {
		variables,
		error,
		isLoading,
		isLoaded,
		refresh,
	};
});

/**
 * A chat's thread variables, kept apart from the session store: they live behind
 * their own REST read, change on their own schedule, and have their own
 * loading and error state. The session store owns this one's lifecycle —
 * `disposeChatSession` disposes it too.
 */
export function useChatVariablesStore(chatId: string) {
	return chatVariables.use(chatId);
}

// A no-op when the chat never opened the tab, so disposing a session does not
// create a store only to throw it away.
export function disposeChatVariables(chatId: string) {
	chatVariables.dispose(chatId);
}
