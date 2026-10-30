import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useSidebarSelectionStore } from '../sidebar-selection';
import { useWorkspaceSidebarStore } from '../workspace-sidebar';

describe('useSidebarSelectionStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
	});

	it('has no selected contact by default', () => {
		const store = useSidebarSelectionStore();

		expect(store.contactId).toBeNull();
	});

	it('selects a contact and opens the sidebar', () => {
		const store = useSidebarSelectionStore();
		const sidebarStore = useWorkspaceSidebarStore();

		store.selectContact('1');

		expect(store.contactId).toBe('1');
		expect(sidebarStore.isOpen).toBe(true);
	});

	it('replaces the selected contact on a new selection', () => {
		const store = useSidebarSelectionStore();

		store.selectContact('1');
		store.selectContact('2');

		expect(store.contactId).toBe('2');
	});

	it('clears the selection without touching the sidebar', () => {
		const store = useSidebarSelectionStore();
		const sidebarStore = useWorkspaceSidebarStore();

		store.selectContact('1');
		store.clearSelection();

		expect(store.contactId).toBeNull();
		expect(sidebarStore.isOpen).toBe(true);
	});
});
