import type { AccountModel } from '@webitel/chat-web-sdk';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { shallowRef } from 'vue';

import { accountService } from '../api/chatSdk';

/**
 * The agent's own account in the chat backend: who they are in a thread, which
 * is how their messages are told from the client's. Everything that needs to
 * make that distinction (the chat sessions, the chat list) reads it here
 * rather than asking for it.
 *
 * It stays `null` until it loads, and when the request fails: the thread then
 * shows no delivery ticks and a preview does not say who wrote the last
 * message, but both still work, and the next `load()` asks again.
 *
 * Logout navigates away (userinfo store: window.location.href = authUrl), so
 * the account never outlives the session it belongs to.
 */
export const useChatAccountStore = defineStore('chat-account', () => {
	// reassigned, never mutated, so shallow reactivity is enough
	const account = shallowRef<AccountModel | null>(null);
	// the request in flight, so concurrent callers share one
	let request: Promise<AccountModel> | null = null;

	async function load() {
		if (account.value) return account.value;

		try {
			request ??= accountService.getAccount();
			account.value = await request;
		} catch {
			// stays null; the next load() makes a fresh request
		} finally {
			request = null;
		}

		return account.value;
	}

	return {
		// state
		account,

		// actions
		load,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useChatAccountStore, import.meta.hot));
}
