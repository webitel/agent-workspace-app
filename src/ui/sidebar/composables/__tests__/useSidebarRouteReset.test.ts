import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type EffectScope, effectScope, nextTick, ref } from 'vue';

import { useSidebarSelectionStore } from '../../store/sidebar-selection';
import { useWorkspaceSidebarStore } from '../../store/workspace-sidebar';
import { useSidebarRouteReset } from '../useSidebarRouteReset';

const routeName = ref<string | undefined>();
const routeQuery = ref<Record<string, string>>({});

vi.mock('vue-router', () => ({
	useRoute: () => ({
		get name() {
			return routeName.value;
		},
		get query() {
			return routeQuery.value;
		},
	}),
}));

describe('useSidebarRouteReset', () => {
	let scope: EffectScope;

	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		routeName.value = 'contacts';
		routeQuery.value = {};

		scope = effectScope();
		scope.run(() => useSidebarRouteReset());

		useSidebarSelectionStore().selectContact('1');
	});

	afterEach(() => {
		scope.stop();
	});

	it('clears the selection and closes the sidebar when the route name changes', async () => {
		routeName.value = 'users';
		await nextTick();

		expect(useSidebarSelectionStore().contactId).toBeNull();
		expect(useWorkspaceSidebarStore().isOpen).toBe(false);
	});

	it('keeps the selection and the sidebar when only the query changes', async () => {
		routeQuery.value = {
			page: '2',
		};
		await nextTick();

		expect(useSidebarSelectionStore().contactId).toBe('1');
		expect(useWorkspaceSidebarStore().isOpen).toBe(true);
	});
});
