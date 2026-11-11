import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ContactCardCommunicationItem from '../contact-card-communication-item.vue';
import type { ContactCommunicationItem } from '../scripts/toContactCommunication';

const stubs = {
	'wt-icon': {
		props: [
			'icon',
		],
		template: '<i class="icon" :data-icon="icon" />',
	},
};

const mountItem = (item: ContactCommunicationItem, slots = {}) =>
	mount(ContactCardCommunicationItem, {
		props: {
			item,
		},
		slots,
		global: {
			stubs,
		},
	});

describe('ContactCardCommunicationItem', () => {
	it('renders the icon and the value', () => {
		const wrapper = mountItem({
			id: '1',
			value: '380991358573',
			icon: 'call--filled',
		});

		expect(wrapper.find('.icon').attributes('data-icon')).toBe('call--filled');
		expect(wrapper.text()).toBe('380991358573');
	});

	it('renders without an icon when there is none', () => {
		const wrapper = mountItem({
			id: '1',
			value: 'someone',
		});

		expect(wrapper.find('.icon').exists()).toBe(false);
		expect(wrapper.text()).toBe('someone');
	});

	it('renders the actions slot', () => {
		const wrapper = mountItem(
			{
				id: '1',
				value: 'poli@test.com',
				icon: 'ws-navigation-emai',
			},
			{
				actions: '<button class="action-stub" />',
			},
		);

		expect(wrapper.find('.action-stub').exists()).toBe(true);
	});
});
