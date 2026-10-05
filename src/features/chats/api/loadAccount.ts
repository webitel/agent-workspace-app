import type { AccountModel } from '@webitel/chat-web-sdk';

import { accountService } from './chatSdk';

// One account request shared by everything that needs to tell the agent from
// the client: chat sessions and the chat list. A failure resolves to null —
// the thread shows no delivery ticks but still loads, a preview does not say
// who wrote the last message — and is not cached, so the next caller tries
// again.
// Logout navigates away (userinfo store: window.location.href = authUrl), so
// the cached account never outlives the session it belongs to.
let accountRequest: Promise<AccountModel | null> | null = null;
export const loadAccount = () => {
	accountRequest ??= accountService.getAccount().catch(() => {
		accountRequest = null;
		return null;
	});
	return accountRequest;
};
