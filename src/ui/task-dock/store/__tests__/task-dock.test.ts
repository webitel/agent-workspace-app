import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useTaskDockStore } from '../task-dock';

describe('useTaskDockStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
	});

	it('expands a call on first toggle and collapses on second', () => {
		const store = useTaskDockStore();

		store.toggleCallExpand('call-1');
		expect(store.expandedCallId).toBe('call-1');

		store.toggleCallExpand('call-1');
		expect(store.expandedCallId).toBeNull();
	});

	it('keeps only one call expanded at a time', () => {
		const store = useTaskDockStore();

		store.toggleCallExpand('call-1');
		store.toggleCallExpand('call-2');

		expect(store.expandedCallId).toBe('call-2');
	});

	it('expands a chat on first toggle and collapses on second', () => {
		const store = useTaskDockStore();

		store.toggleChatExpand('chat-1');
		expect(store.expandedChatId).toBe('chat-1');

		store.toggleChatExpand('chat-1');
		expect(store.expandedChatId).toBeNull();
	});

	it('keeps call and chat expand state in separate lanes', () => {
		const store = useTaskDockStore();

		store.toggleCallExpand('call-1');
		store.toggleChatExpand('chat-1');

		store.toggleCallExpand('call-1');

		expect(store.expandedCallId).toBeNull();
		expect(store.expandedChatId).toBe('chat-1');
	});
});
