import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { OfferKind, type OfferPreview } from '../../../types/Offer.types';
import OfferActions from '../offer-actions.vue';
import OfferCard from '../offer-card.vue';

const buildPreview = (overrides: Partial<OfferPreview> = {}): OfferPreview => ({
	kind: OfferKind.Call,
	name: 'John Smith',
	identifier: '380671234678',
	...overrides,
});

const mountCard = (props: Record<string, unknown> = {}) =>
	mount(OfferCard, {
		props: {
			preview: buildPreview(),
			...props,
		},
	});

describe('offer-card', () => {
	/**
	 * An offer carries one `source`, and where it belongs is the only channel
	 * decision the card's parts cannot make for themselves: chats name their
	 * gateway beside the contact, calls name their queue below the wait bar.
	 */
	it('renders a chat offer’s source inside the identity block', () => {
		const wrapper = mountCard({
			preview: buildPreview({
				kind: OfferKind.Chat,
				source: {
					label: 'Channel',
					value: 'Telegram',
				},
			}),
		});

		expect(wrapper.find('.offer-identity .offer-source-line').text()).toContain(
			'Telegram',
		);
		expect(wrapper.find('.offer-card__queue').exists()).toBe(false);
	});

	it('renders a call offer’s source as the queue line', () => {
		const wrapper = mountCard({
			preview: buildPreview({
				source: {
					label: 'Queue',
					value: 'Support',
				},
			}),
		});

		expect(wrapper.find('.offer-card__queue').text()).toContain('Support');
		expect(wrapper.find('.offer-identity .offer-source-line').exists()).toBe(
			false,
		);
	});

	it('shows the last message only when the channel has one', () => {
		expect(mountCard().find('.offer-last-message').exists()).toBe(false);

		const withMessage = mountCard({
			preview: buildPreview({
				kind: OfferKind.Chat,
				body: 'Hello there',
			}),
		});
		expect(withMessage.find('.offer-last-message').text()).toBe('Hello there');
	});

	// AC_06.01.04: a chat's body opens the conversation, a call's body does not
	it('emits a body click only when the offer is clickable', async () => {
		const plain = mountCard();
		await plain.find('.offer-card__body').trigger('click');
		expect(plain.emitted('bodyClick')).toBeUndefined();

		const clickable = mountCard({
			clickable: true,
		});
		await clickable.find('.offer-card__body').trigger('click');
		expect(clickable.emitted('bodyClick')).toHaveLength(1);
	});

	it('forwards the actions its buttons raise', async () => {
		const wrapper = mountCard();
		const actions = wrapper.findComponent(OfferActions);

		await actions.vm.$emit('accept');
		await actions.vm.$emit('decline');

		expect(wrapper.emitted('accept')).toHaveLength(1);
		expect(wrapper.emitted('decline')).toHaveLength(1);
	});

	it('passes the in-flight action down to the buttons', () => {
		const wrapper = mountCard({
			pending: 'decline',
		});

		expect(wrapper.findComponent(OfferActions).props('pending')).toBe(
			'decline',
		);
	});
});
