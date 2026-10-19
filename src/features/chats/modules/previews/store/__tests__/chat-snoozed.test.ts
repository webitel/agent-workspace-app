import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useChatSnoozedStore } from '../chat-snoozed';

describe('chat-snoozed store', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	// nothing says which chats are snoozed yet, so none is as far as the app can
	// tell (see "Snoozed chat" in CONTEXT.md)
	it('holds no chat until something supplies them', () => {
		const store = useChatSnoozedStore();

		expect(store.tasks).toEqual([]);
		expect(store.count).toBe(0);
	});
});
