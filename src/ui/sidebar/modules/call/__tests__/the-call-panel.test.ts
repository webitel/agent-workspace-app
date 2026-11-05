import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { type Call, CallDirection } from 'webitel-sdk';

vi.mock(
	'../../../../../features/calls/components/call-info-panel/call-info-panel.vue',
	() => ({
		default: {
			name: 'CallInfoPanel',
			props: [
				'content',
			],
			template: '<div class="call-info-panel-stub" />',
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

const call = {
	id: 'call-1',
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
} as unknown as Call;

const mountPanel = () =>
	mount(TheCallPanel, {
		props: {
			call,
		},
	});

describe('the-call-panel', () => {
	it('shows the info of the given call', () => {
		const wrapper = mountPanel();

		expect(
			wrapper
				.findComponent({
					name: 'CallInfoPanel',
				})
				.props('content'),
		).toMatchObject({
			direction: CallDirection.Inbound,
			from: '+12023417842',
			queueName: 'Sales',
		});
	});

	it('shows the identification block with no contacts yet', () => {
		const wrapper = mountPanel();

		expect(
			wrapper
				.findComponent({
					name: 'ContactIdentification',
				})
				.props('contactIds'),
		).toEqual([]);
	});
});
