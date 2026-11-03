import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { ContactsPageTab } from '../../../pages/modules/contacts/enums/ContactsPageTab.enum';
import { HistoryPageTab } from '../../../pages/modules/history/enums/HistoryPageTab.enum';
import TheCallPanel from '../../modules/call/the-call-panel.vue';
import TheContactsPanel from '../../modules/contacts/the-contacts-panel.vue';
import TheHistoryPanel from '../../modules/history/the-history-panel.vue';
import { useSidebarContent } from '../useSidebarContent';

const routeName = ref<string | undefined>();

vi.mock('vue-router', () => ({
	useRoute: () => ({
		get name() {
			return routeName.value;
		},
	}),
}));

// The real calls store imports the router, which leads back here through the
// layout's sidebar; the map only needs the panel component to exist.
vi.mock('../../../../features/calls/store/calls', () => ({
	useCallsStore: vi.fn(),
}));

describe('useSidebarContent', () => {
	it('returns the history panel for the History calls tab', () => {
		routeName.value = HistoryPageTab.Calls;
		const { content } = useSidebarContent();

		expect(content.value).toEqual({
			component: TheHistoryPanel,
		});
	});

	it('returns the contacts panel for the Contacts tab', () => {
		routeName.value = ContactsPageTab.Contacts;
		const { content } = useSidebarContent();

		expect(content.value).toEqual({
			component: TheContactsPanel,
		});
	});

	it('returns the call panel for the call window', () => {
		routeName.value = 'call-window';
		const { content } = useSidebarContent();

		expect(content.value).toEqual({
			component: TheCallPanel,
		});
	});

	it('returns null for a route without sidebar content', () => {
		routeName.value = 'unknown-route';
		const { content } = useSidebarContent();

		expect(content.value).toBeNull();
	});

	it('updates when the route changes', () => {
		routeName.value = 'unknown-route';
		const { content } = useSidebarContent();
		expect(content.value).toBeNull();

		routeName.value = HistoryPageTab.Calls;
		expect(content.value?.component).toBe(TheHistoryPanel);
	});
});
