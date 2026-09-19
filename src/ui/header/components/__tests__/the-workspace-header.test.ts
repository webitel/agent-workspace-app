import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { defineStore } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const { stub } = vi.hoisted(() => ({
	stub: (name: string) => ({
		name,
		template: '<div><slot /></div>',
	}),
}));

vi.mock('@webitel/ui-sdk/components', () => ({
	WtAppHeader: stub('WtAppHeader'),
	WtCallMediaMetric: stub('WtCallMediaMetric'),
	WtChip: stub('WtChip'),
	WtLogo: stub('WtLogo'),
	WtStatusSelect: stub('WtStatusSelect'),
}));

vi.mock('@webitel/ui-sdk/modules/Appearance', () => ({
	WtDarkModeSwitcher: stub('WtDarkModeSwitcher'),
	createAppearanceStore: () =>
		defineStore('appearance', () => ({
			darkMode: ref(false),
			setTheme: vi.fn(),
		})),
}));

vi.mock('@webitel/ui-sdk/modules/AgentStatusSelect', () => ({
	PauseCauseAPI: {
		getList: vi.fn(),
	},
	useActivityTypesOptions: () => ({
		activityTypes: {
			value: [],
		},
		loadActivityTypes: vi.fn(),
	}),
	WtCcActivityTypePopup: stub('WtCcActivityTypePopup'),
	WtCcPauseCausePopup: stub('WtCcPauseCausePopup'),
	WtCcStatusSelectErrorPopup: stub('WtCcStatusSelectErrorPopup'),
}));

vi.mock('../../../../app/locale/i18n', () => ({
	default: {
		global: {
			t: (key: string) => key,
		},
	},
}));

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		agent: {
			value: undefined,
		},
		state: {
			value: 'idle',
		},
		getAgentSession: vi.fn(),
		on: vi.fn(),
		latency: vi.fn(),
	}),
}));

import AgentStatusSelect from '../agent-status-select.vue';
import TheWorkspaceHeader from '../the-workspace-header.vue';
import UserDndSwitcher from '../user-dnd-switcher.vue';

/*
 * The header renders its controls into wt-app-header's slot, and a shallow
 * mount's auto-stub drops slot content — so that one stub has to render it.
 */
const mountHeader = () =>
	mount(TheWorkspaceHeader, {
		shallow: true,
		global: {
			plugins: [
				createTestingPinia(),
			],
			stubs: {
				WtAppHeader: {
					template: '<div><slot /></div>',
				},
			},
		},
	});

describe('the-workspace-header', () => {
	it('offers the agent their status select', () => {
		const wrapper = mountHeader();

		expect(wrapper.findComponent(AgentStatusSelect).exists()).toBe(true);
	});

	it('places the status select after the DnD switcher, as designed', () => {
		const wrapper = mountHeader();

		const html = wrapper.html();

		expect(html.indexOf('agent-status-select')).toBeGreaterThan(
			html.indexOf('user-dnd-switcher'),
		);
		expect(wrapper.findComponent(UserDndSwitcher).exists()).toBe(true);
	});
});
