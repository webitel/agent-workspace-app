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

	it('expands a call', () => {
		const store = useTaskDockStore();

		store.setCallExpanded('call-1', true);

		expect(store.expandedCallId).toBe('call-1');
	});

	it('collapses the expanded call', () => {
		const store = useTaskDockStore();
		store.setCallExpanded('call-1', true);

		store.setCallExpanded('call-1', false);

		expect(store.expandedCallId).toBeNull();
	});

	it('keeps another call expanded when a different one is collapsed', () => {
		const store = useTaskDockStore();
		store.setCallExpanded('call-2', true);

		store.setCallExpanded('call-1', false);

		expect(store.expandedCallId).toBe('call-2');
	});

	it('keeps only one call expanded at a time', () => {
		const store = useTaskDockStore();

		store.setCallExpanded('call-1', true);
		store.setCallExpanded('call-2', true);

		expect(store.expandedCallId).toBe('call-2');
	});

	it('stays expanded when the same call is expanded twice', () => {
		const store = useTaskDockStore();

		store.setCallExpanded('call-1', true);
		store.setCallExpanded('call-1', true);

		expect(store.expandedCallId).toBe('call-1');
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

		store.setCallExpanded('call-1', true);
		store.toggleChatExpand('chat-1');

		store.setCallExpanded('call-1', false);

		expect(store.expandedCallId).toBeNull();
		expect(store.expandedChatId).toBe('chat-1');
	});
});
