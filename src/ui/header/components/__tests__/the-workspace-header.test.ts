import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { WtApplication } from '@webitel/ui-sdk/enums';
import { defineStore } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const { stub, mockGetConfig } = vi.hoisted(() => ({
	stub: (name: string) => ({
		name,
		template: '<div><slot /></div>',
	}),
	mockGetConfig: vi.fn(),
}));

vi.mock('@webitel/ui-sdk/components', () => ({
	WtAppHeader: stub('WtAppHeader'),
	WtAppNavigator: {
		name: 'WtAppNavigator',
		props: [
			'apps',
			'currentApp',
			'darkMode',
		],
		template: '<div />',
	},
	WtCallMediaMetric: stub('WtCallMediaMetric'),
	WtChip: stub('WtChip'),
	WtHeaderActions: stub('WtHeaderActions'),
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

vi.mock('@webitel/ui-sdk/modules/Userinfo', () => ({
	createUserinfoStore: () =>
		defineStore('userinfo', () => ({
			userInfo: ref({}),
			hasApplicationVisibility: (_app: string) => true,
			logoutUser: () => {},
		})),
}));

vi.mock('@webitel/ui-sdk/modules/AgentStatusSelect', () => ({
	WtCcAgentStatusSelect: stub('WtCcAgentStatusSelect'),
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

vi.mock('../../../../features/appConfig/config', () => ({
	getConfig: mockGetConfig,
}));

import { useUserinfoStore } from '../../../../features/userinfo/stores/userinfoStore';
import AgentStatusSelect from '../agent-status-select.vue';
import TheWorkspaceHeader from '../the-workspace-header.vue';
import UserDndSwitcher from '../user-dnd-switcher.vue';

/*
 * The header reads ON_SITE from the runtime config on mount — without a
 * resolved value there, onMounted would throw in every test.
 */
beforeEach(() => {
	mockGetConfig.mockResolvedValue({
		ON_SITE: false,
	});
});

/*
 * The header renders its controls into wt-app-header's slot, and a shallow
 * mount's auto-stub drops slot content — so that one stub has to render it.
 */
const mountHeader = ({
	visibleApps,
}: {
	visibleApps?: WtApplication[];
} = {}) => {
	const pinia = createTestingPinia();

	if (visibleApps) {
		vi.mocked(useUserinfoStore().hasApplicationVisibility).mockImplementation(
			(app) => visibleApps.includes(app),
		);
	}

	return mount(TheWorkspaceHeader, {
		shallow: true,
		global: {
			plugins: [
				pinia,
			],
			stubs: {
				WtAppHeader: {
					template: '<div><slot /></div>',
				},
			},
		},
	});
};

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

describe('the-workspace-header app navigator', () => {
	const getNavigatorAppNames = (wrapper: ReturnType<typeof mountHeader>) =>
		(
			wrapper
				.findComponent({
					name: 'WtAppNavigator',
				})
				.props('apps') as {
				name: WtApplication;
			}[]
		).map(({ name }) => name);

	it('offers only the apps the user has access to', () => {
		const visibleApps = [
			WtApplication.Agent,
			WtApplication.History,
		];
		const wrapper = mountHeader({
			visibleApps,
		});

		const names = getNavigatorAppNames(wrapper);

		expect(names).toHaveLength(visibleApps.length);
		expect(names).toEqual(expect.arrayContaining(visibleApps));
	});

	it('offers no apps when the user has access to none of them', () => {
		const wrapper = mountHeader({
			visibleApps: [],
		});

		expect(getNavigatorAppNames(wrapper)).toEqual([]);
	});

	it('offers Analytics on on-site installations', async () => {
		mockGetConfig.mockResolvedValue({
			ON_SITE: true,
		});
		const wrapper = mountHeader({
			visibleApps: [
				WtApplication.Analytics,
			],
		});

		await flushPromises();

		expect(getNavigatorAppNames(wrapper)).toEqual([
			WtApplication.Analytics,
		]);
	});

	it('hides Analytics outside on-site installations, even with access', async () => {
		const wrapper = mountHeader({
			visibleApps: [
				WtApplication.Analytics,
			],
		});

		await flushPromises();

		expect(getNavigatorAppNames(wrapper)).toEqual([]);
	});
});
