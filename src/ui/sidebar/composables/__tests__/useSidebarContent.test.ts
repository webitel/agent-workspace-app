import { describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import { CallsRouteName } from '../../../pages/modules/calls/enums/CallsRouteName.enum';
import { ContactsPageTab } from '../../../pages/modules/contacts/enums/ContactsPageTab.enum';
import { HistoryPageTab } from '../../../pages/modules/history/enums/HistoryPageTab.enum';
import TheCallPanel from '../../modules/call/the-call-panel.vue';
import TheContactsPanel from '../../modules/contacts/the-contacts-panel.vue';
import TheHistoryPanel from '../../modules/history/the-history-panel.vue';
import { useSidebarContent } from '../useSidebarContent';

const route = reactive<{
	name: string | undefined;
	params: Record<string, string>;
}>({
	name: undefined,
	params: {},
});

vi.mock('vue-router', () => ({
	useRoute: () => route,
}));

const callsById = reactive<Record<string, unknown>>({});

// The real calls store imports the router, which leads back here through the
// layout's sidebar; the map only needs the id -> call lookup.
vi.mock('../../../../features/calls/store/calls', () => ({
	useCallsStore: () => ({
		getCallById: (id: string) => callsById[id],
	}),
}));

describe('useSidebarContent', () => {
	it('returns the history panel for the History calls tab', () => {
		route.name = HistoryPageTab.Calls;
		const { content } = useSidebarContent();

		expect(content.value).toEqual({
			component: TheHistoryPanel,
		});
	});

	it('returns the contacts panel for the Contacts tab', () => {
		route.name = ContactsPageTab.Contacts;
		const { content } = useSidebarContent();

		expect(content.value).toEqual({
			component: TheContactsPanel,
		});
	});

	it('returns the contacts panel for the Users tab', () => {
		route.name = ContactsPageTab.Users;
		const { content } = useSidebarContent();

		expect(content.value).toEqual({
			component: TheContactsPanel,
		});
	});

	it('returns the call panel with the call open on the page', () => {
		const call = {
			id: 'call-1',
		};
		callsById['call-1'] = call;
		route.name = CallsRouteName.CallWindow;
		route.params = {
			callId: 'call-1',
		};
		const { content } = useSidebarContent();

		expect(content.value).toEqual({
			component: TheCallPanel,
			props: {
				call,
			},
		});
	});

	it('returns null on the call page when its call is gone', () => {
		route.name = CallsRouteName.CallWindow;
		route.params = {
			callId: 'gone',
		};
		const { content } = useSidebarContent();

		expect(content.value).toBeNull();
	});

	it('returns null for a route without sidebar content', () => {
		route.name = 'unknown-route';
		const { content } = useSidebarContent();

		expect(content.value).toBeNull();
	});

	it('updates when the route changes', () => {
		route.name = 'unknown-route';
		const { content } = useSidebarContent();
		expect(content.value).toBeNull();

		route.name = HistoryPageTab.Calls;
		expect(content.value?.component).toBe(TheHistoryPanel);
	});
});
