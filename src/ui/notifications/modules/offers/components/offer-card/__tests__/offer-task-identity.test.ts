import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import OfferTaskIdentity from '../offer-task-identity.vue';

describe('offer-task-identity', () => {
	it('names the queue member and their destination', () => {
		const wrapper = mount(OfferTaskIdentity, {
			props: {
				name: 'John Smith',
				destination: 'Callback request',
			},
		});

		expect(wrapper.find('.offer-task-identity__name').text()).toBe(
			'John Smith',
		);
		expect(wrapper.find('.offer-task-identity__destination').text()).toBe(
			'Callback request',
		);
	});

	it('falls back to "unknown contact" when the member has no name', () => {
		const wrapper = mount(OfferTaskIdentity, {
			props: {
				destination: 'Callback request',
			},
		});

		expect(wrapper.text()).toContain('ui.notifications.offer.unknownContact');
	});

	it('omits the destination when the member has none', () => {
		const wrapper = mount(OfferTaskIdentity, {
			props: {
				name: 'John Smith',
			},
		});

		expect(wrapper.find('.offer-task-identity__destination').exists()).toBe(
			false,
		);
	});
});
