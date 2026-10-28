import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useSidebarSelectionStore } from '../sidebar-selection';
import { useWorkspaceSidebarStore } from '../workspace-sidebar';

describe('useWorkspaceSidebarStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
	});

	it('is closed by default', () => {
		expect(useWorkspaceSidebarStore().isOpen).toBe(false);
	});

	it('opens and closes', () => {
		const store = useWorkspaceSidebarStore();

		store.open();
		expect(store.isOpen).toBe(true);

		store.close();
		expect(store.isOpen).toBe(false);
	});

	it('toggles', () => {
		const store = useWorkspaceSidebarStore();

		store.toggle();
		expect(store.isOpen).toBe(true);

		store.toggle();
		expect(store.isOpen).toBe(false);
	});

	it('clears the selection on close', () => {
		const selectionStore = useSidebarSelectionStore();
		selectionStore.selectContact('1');

		useWorkspaceSidebarStore().close();

		expect(selectionStore.contactId).toBeNull();
	});

	it('clears the selection when toggled closed', () => {
		const selectionStore = useSidebarSelectionStore();
		selectionStore.selectContact('1');

		useWorkspaceSidebarStore().toggle();

		expect(selectionStore.contactId).toBeNull();
	});

	it('reopens without a selection after closing', () => {
		const store = useWorkspaceSidebarStore();
		const selectionStore = useSidebarSelectionStore();
		selectionStore.selectContact('1');

		store.toggle();
		store.toggle();

		expect(store.isOpen).toBe(true);
		expect(selectionStore.contactId).toBeNull();
	});
});
