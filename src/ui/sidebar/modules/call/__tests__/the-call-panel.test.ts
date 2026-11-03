import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import { CallDirection } from 'webitel-sdk';

const route = reactive({
	params: {
		callId: 'call-1',
	},
});

vi.mock('vue-router', () => ({
	useRoute: () => route,
}));

const callsById = reactive<Record<string, unknown>>({});

// The real calls store pulls the socket client and offers in; the panel only
// needs the id -> call lookup.
vi.mock('../../../../../features/calls/store/calls', () => ({
	useCallsStore: () => ({
		getCallById: (id: string) => callsById[id],
	}),
}));

vi.mock(
	'../../../../../features/calls/components/call-panel-info/call-panel-info.vue',
	() => ({
		default: {
			name: 'CallPanelInfo',
			props: [
				'info',
			],
			template: '<div class="call-panel-info-stub" />',
		},
	}),
);

vi.mock('../../../components/contact/contact-identification.vue', () => ({
	default: {
		name: 'ContactIdentification',
		props: [
			'contactIds',
			'isLoading',
		],
		template: '<div class="contact-identification-stub" />',
	},
}));

import TheCallPanel from '../the-call-panel.vue';

const makeCall = (id: string) => ({
	id,
	direction: CallDirection.Inbound,
	from: {
		type: 'dest',
		number: '+12023417842',
	},
	to: {
		type: 'user',
		number: '1001',
	},
	hideNumber: false,
	queue: {
		queue_name: 'Sales',
	},
	createdAt: 1_700_000_000_000,
	answeredAt: 1_700_000_015_000,
});

describe('the-call-panel', () => {
	beforeEach(() => {
		for (const id of Object.keys(callsById)) delete callsById[id];
		route.params.callId = 'call-1';
	});

	it('renders nothing when the route has no such call', () => {
		const wrapper = mount(TheCallPanel);

		expect(wrapper.find('.call-panel').exists()).toBe(false);
	});

	it('shows the info of the call open on the page', () => {
		callsById['call-1'] = makeCall('call-1');
		const wrapper = mount(TheCallPanel);

		expect(
			wrapper
				.findComponent({
					name: 'CallPanelInfo',
				})
				.props('info'),
		).toMatchObject({
			direction: CallDirection.Inbound,
			from: '+12023417842',
			queueName: 'Sales',
		});
	});

	it('shows the identification block with no contacts yet', () => {
		callsById['call-1'] = makeCall('call-1');
		const wrapper = mount(TheCallPanel);

		expect(
			wrapper
				.findComponent({
					name: 'ContactIdentification',
				})
				.props('contactIds'),
		).toEqual([]);
	});
});
