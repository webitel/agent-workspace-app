import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

const getMissedCallsMock = vi.fn();
const redialMissedCallMock = vi.fn();

vi.mock('../api/missedCallsAPI', () => ({
	getMissedCalls: (...args: unknown[]) => getMissedCallsMock(...args),
	redialMissedCall: (...args: unknown[]) => redialMissedCallMock(...args),
}));

vi.mock('@webitel/ui-sdk/components', () => ({
	WtAvatar: {
		name: 'WtAvatar',
		props: [
			'username',
		],
		template: '<span class="wt-avatar-stub">{{ username }}</span>',
	},
	WtDatetimeText: {
		name: 'WtDatetimeText',
		props: [
			'datetime',
		],
		template: '<span class="wt-datetime-stub">{{ datetime }}</span>',
	},
	WtIconBtn: {
		name: 'WtIconBtn',
		props: [
			'icon',
		],
		// declaring `emits` matters here: without it Vue also forwards the
		// parent's @click as a native fallthrough listener on the root
		// <button>, so the click would fire the handler twice
		emits: [
			'click',
		],
		template:
			'<button type="button" :data-icon="icon" @click="$emit(\'click\')" />',
	},
	// Mirrors the real component's per-column scoped slots (see wt-table.vue)
	// closely enough to exercise our slot content and click wiring.
	WtTable: {
		name: 'WtTable',
		props: [
			'headers',
			'data',
		],
		template: `
			<div class="wt-table-stub">
				<div v-for="item in data" :key="item.id" class="row">
					<slot name="name" :item="item" />
					<slot name="createdAt" :item="item" />
					<slot name="duration" :item="item" />
					<slot name="actions" :item="item" />
				</div>
			</div>
		`,
	},
}));

import MissedCallsTab from '../missed-calls-tab.vue';

const buildRow = (overrides: Record<string, unknown> = {}) => ({
	id: 'call-1',
	contactId: 'contact-1',
	name: 'Jane Doe',
	phoneNumber: '380671234567',
	createdAt: '2026-01-01T10:00:00Z',
	duration: 65,
	queueName: 'Sales',
	...overrides,
});

const routes = [
	{
		path: '/calls',
		name: 'calls',
		component: {
			template: '<div />',
		},
	},
];

// several of the internal steps (persistence restore, router navigation)
// resolve across more than one microtask tick
const flush = async () => {
	for (let i = 0; i < 5; i += 1) {
		await new Promise((resolve) => setTimeout(resolve));
	}
};

describe('missed-calls-tab', () => {
	let router: Router;

	beforeEach(async () => {
		localStorage.clear();
		sessionStorage.clear();
		setActivePinia(createPinia());
		vi.clearAllMocks();

		router = createRouter({
			history: createMemoryHistory(),
			routes,
		});
		await router.push('/calls');
		await router.isReady();

		getMissedCallsMock.mockResolvedValue({
			items: [
				buildRow(),
			],
			next: false,
		});
	});

	const mountComponent = async () => {
		const wrapper = mount(MissedCallsTab, {
			global: {
				plugins: [
					router,
				],
				directives: {
					tooltip: {},
				},
			},
		});
		await flush();
		return wrapper;
	};

	it('loads the list on mount and renders the row name, avatar and formatted duration', async () => {
		const wrapper = await mountComponent();

		expect(getMissedCallsMock).toHaveBeenCalled();
		expect(wrapper.find('.wt-avatar-stub').text()).toBe('Jane Doe');
		expect(wrapper.text()).toContain('Jane Doe');
		expect(wrapper.text()).toContain('00:01:05');
	});

	it('redials the row when the call action is clicked', async () => {
		const wrapper = await mountComponent();

		await wrapper.find('[data-icon="call"]').trigger('click');

		expect(redialMissedCallMock).toHaveBeenCalledWith('call-1');
	});

	it('warns instead of opening the (not-yet-built) contact card when the name or expand icon is clicked', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const wrapper = await mountComponent();

		await wrapper.find('.missed-calls-tab__name-cell').trigger('click');
		expect(warnSpy).toHaveBeenCalledTimes(1);

		await wrapper.find('[data-icon="arrow-right"]').trigger('click');
		expect(warnSpy).toHaveBeenCalledTimes(2);

		warnSpy.mockRestore();
	});
});
