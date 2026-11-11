import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { SidebarSelectionType } from '../../enums/SidebarSelectionType.enum';
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

	it('has no selection by default', () => {
		const store = useSidebarSelectionStore();

		expect(store.selection).toBeNull();
		expect(store.contactId).toBeNull();
		expect(store.isUnknownSelected).toBe(false);
	});

	it('selects a contact and opens the sidebar', () => {
		const store = useSidebarSelectionStore();
		const sidebarStore = useWorkspaceSidebarStore();

		store.selectContact('1');

		expect(store.selection).toEqual({
			type: SidebarSelectionType.Contact,
			id: '1',
		});
		expect(store.contactId).toBe('1');
		expect(store.isUnknownSelected).toBe(false);
		expect(sidebarStore.isOpen).toBe(true);
	});

	it('replaces the selected contact on a new selection', () => {
		const store = useSidebarSelectionStore();

		store.selectContact('1');
		store.selectContact('2');

		expect(store.contactId).toBe('2');
	});

	it('selects an unknown contact and opens the sidebar', () => {
		const store = useSidebarSelectionStore();
		const sidebarStore = useWorkspaceSidebarStore();

		store.selectUnknownContact();

		expect(store.selection).toEqual({
			type: SidebarSelectionType.Unknown,
		});
		expect(store.isUnknownSelected).toBe(true);
		expect(sidebarStore.isOpen).toBe(true);
	});

	it('exposes contactId only for a selected contact', () => {
		const store = useSidebarSelectionStore();

		store.selectContact('1');
		store.selectUnknownContact();

		expect(store.contactId).toBeNull();
	});

	describe('selectContactOrUnknown', () => {
		it('selects the contact by a string id', () => {
			const store = useSidebarSelectionStore();

			store.selectContactOrUnknown('1');

			expect(store.contactId).toBe('1');
		});

		it('selects the contact by a numeric id as a string', () => {
			const store = useSidebarSelectionStore();

			store.selectContactOrUnknown(42);

			expect(store.contactId).toBe('42');
		});

		it.each([
			undefined,
			null,
			'',
		])('selects an unknown contact for id %s', (id) => {
			const store = useSidebarSelectionStore();
			const sidebarStore = useWorkspaceSidebarStore();

			store.selectContactOrUnknown(id);

			expect(store.isUnknownSelected).toBe(true);
			expect(sidebarStore.isOpen).toBe(true);
		});
	});

	it('clears the selection without touching the sidebar', () => {
		const store = useSidebarSelectionStore();
		const sidebarStore = useWorkspaceSidebarStore();

		store.selectContact('1');
		store.clearSelection();

		expect(store.selection).toBeNull();
		expect(store.contactId).toBeNull();
		expect(store.isUnknownSelected).toBe(false);
		expect(sidebarStore.isOpen).toBe(true);
	});
});
