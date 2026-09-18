import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const initializeMock = vi.fn();
const redialMock = vi.fn();

const rows = [
	{
		id: 'call-1',
		contactId: 'contact-1',
		name: 'Jane Doe',
		phoneNumber: '380671234567',
		createdAt: '2026-01-01T10:00:00Z',
		duration: 65,
		queueName: 'Sales',
	},
];

vi.mock('../../store/missedCalls', () => ({
	useMissedCallsStore: () => ({
		rows,
		headers: [],
		loading: false,
		search: '',
		initialize: initializeMock,
		loadMore: vi.fn(),
		applySort: vi.fn(),
		setSearch: vi.fn(),
		redial: (...args: unknown[]) => redialMock(...args),
	}),
}));

vi.mock('../missed-calls-search-toggle.vue', () => ({
	default: {
		name: 'MissedCallsSearchToggle',
		template: '<div class="missed-calls-search-toggle-stub" />',
	},
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

import TheMissedCalls from '../the-missed-calls.vue';

const mountComponent = () =>
	mount(TheMissedCalls, {
		global: {
			directives: {
				tooltip: {},
			},
		},
	});

describe('the-missed-calls', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('initializes the store on mount', () => {
		mountComponent();

		expect(initializeMock).toHaveBeenCalledTimes(1);
	});

	it('renders the row name, avatar and formatted duration', () => {
		const wrapper = mountComponent();

		expect(wrapper.find('.wt-avatar-stub').text()).toBe('Jane Doe');
		expect(wrapper.text()).toContain('Jane Doe');
		expect(wrapper.text()).toContain('00:01:05');
	});

	it('redials the row when the call action is clicked', async () => {
		const wrapper = mountComponent();

		await wrapper.find('[data-icon="call"]').trigger('click');

		expect(redialMock).toHaveBeenCalledWith('call-1');
	});

	it('warns instead of opening the (not-yet-built) contact card when the name or expand icon is clicked', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const wrapper = mountComponent();

		await wrapper.find('.the-missed-calls__name-cell').trigger('click');
		expect(warnSpy).toHaveBeenCalledTimes(1);

		await wrapper.find('[data-icon="arrow-right"]').trigger('click');
		expect(warnSpy).toHaveBeenCalledTimes(2);

		warnSpy.mockRestore();
	});
});
