import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import OfferIdentity from '../offer-identity.vue';

describe('offer-identity', () => {
	it('falls back to "unknown contact" when identification found no name', () => {
		const wrapper = mount(OfferIdentity, {
			props: {
				identifier: '380671234678',
			},
		});

		expect(wrapper.text()).toContain('ui.notifications.offer.unknownContact');
	});

	/**
	 * The chip counts the contacts *beyond* the one named, so nothing to show is
	 * the same as exactly one match — and the count is absent entirely until the
	 * backend supplies it (WS-16).
	 */
	it.each([
		[
			undefined,
			false,
		],
		[
			0,
			false,
		],
		[
			3,
			true,
		],
	])('shows the +N chip only for a remainder: %s', (additionalContacts, shown) => {
		const wrapper = mount(OfferIdentity, {
			props: {
				name: 'John Smith',
				additionalContacts,
			},
		});

		const chip = wrapper.find('.wt-chip');
		expect(chip.exists()).toBe(shown);
		if (shown) expect(chip.text()).toContain('+3');
	});

	it('omits the identifier when the channel has none', () => {
		const wrapper = mount(OfferIdentity, {
			props: {
				name: 'John Smith',
			},
		});

		expect(wrapper.find('.offer-identity__identifier').exists()).toBe(false);
	});

	// chats name their gateway here; calls name their queue on the card instead
	it('names the gateway beside the contact when there is one', () => {
		const wrapper = mount(OfferIdentity, {
			props: {
				name: 'John Smith',
				channel: {
					label: 'Channel',
					value: 'Telegram',
				},
			},
		});

		expect(wrapper.find('.offer-source-line').text()).toContain('Telegram');
	});

	it('renders no gateway line for a channel-less offer', () => {
		const wrapper = mount(OfferIdentity, {
			props: {
				name: 'John Smith',
			},
		});

		expect(wrapper.find('.offer-source-line').exists()).toBe(false);
	});
});
