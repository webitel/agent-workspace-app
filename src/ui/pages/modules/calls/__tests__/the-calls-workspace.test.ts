import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('vue-router', () => ({
	useRoute: () => ({
		name: 'calls',
	}),
}));

vi.mock('../../../components/ws-page-wrapper.vue', () => ({
	default: {
		name: 'WsPageWrapper',
		template: '<div><slot name="actions-panel" /><slot name="main" /></div>',
	},
}));

vi.mock('../../../components/ws-table-action-panel.vue', () => ({
	default: {
		name: 'WsTableActionPanel',
		template: '<div />',
	},
}));

vi.mock('../modules/missed-calls/missed-calls-tab.vue', () => ({
	default: {
		name: 'MissedCallsTab',
		template: '<div class="missed-calls-tab-stub" />',
	},
}));

vi.mock('../modules/missed-calls/store/missedCalls', () => ({
	useMissedCallsStore: () => ({
		headers: [],
		loadDataList: vi.fn(),
		hasFilter: vi.fn(),
		addFilter: vi.fn(),
		updateFilter: vi.fn(),
		deleteFilter: vi.fn(),
		updateShownHeaders: vi.fn(),
	}),
}));

import TheCallsWorkspace from '../the-calls-workspace.vue';

describe('the-calls-workspace', () => {
	it('shows the Missed tab content by default', () => {
		const wrapper = mount(TheCallsWorkspace);

		expect(wrapper.find('.missed-calls-tab-stub').exists()).toBe(true);
	});
});
