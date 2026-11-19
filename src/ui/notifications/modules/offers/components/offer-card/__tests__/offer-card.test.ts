import { mount } from '@vue/test-utils';
import { WtDivider } from '@webitel/ui-sdk/components';
import { describe, expect, it } from 'vitest';

import { type OfferCardContent, OfferKind } from '../../../types/Offer.types';
import OfferActions from '../offer-actions.vue';
import OfferCard from '../offer-card.vue';

const buildContent = (
	overrides: Partial<OfferCardContent> = {},
): OfferCardContent => ({
	kind: OfferKind.Call,
	name: 'John Smith',
	identifier: '380671234678',
	...overrides,
});

const mountCard = (props: Record<string, unknown> = {}) =>
	mount(OfferCard, {
		props: {
			content: buildContent(),
			...props,
		},
	});

describe('offer-card', () => {
	// a chat names its gateway beside the contact, not in the details block
	it('renders a chat offer’s source inside the identity block', () => {
		const wrapper = mountCard({
			content: buildContent({
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
		expect(wrapper.find('.offer-card__details').exists()).toBe(false);
	});

	it.each([
		OfferKind.Call,
		OfferKind.Chat,
	])('renders the queue line of a %s offer', (kind) => {
		const wrapper = mountCard({
			content: buildContent({
				kind,
				queueName: 'Support',
			}),
		});

		expect(wrapper.find('.offer-card__queue').text()).toContain('Support');
		expect(wrapper.find('.offer-identity .offer-source-line').exists()).toBe(
			false,
		);
	});

	it('renders the variables without a queue', () => {
		const wrapper = mountCard({
			content: buildContent({
				variables: [
					{
						label: 'Language',
						value: 'EN',
					},
				],
			}),
		});

		expect(wrapper.find('.offer-card__queue').exists()).toBe(false);
		expect(wrapper.find('.offer-variables').text()).toContain('EN');
	});

	// AC_06.01.06: neither a queue nor variables — no block and no divider
	it('drops the details block and its divider when there is nothing to show', () => {
		const empty = mountCard();
		const withQueue = mountCard({
			content: buildContent({
				queueName: 'Support',
			}),
		});

		expect(empty.find('.offer-card__details').exists()).toBe(false);
		expect(withQueue.findAllComponents(WtDivider)).toHaveLength(
			empty.findAllComponents(WtDivider).length + 1,
		);
	});

	it('shows the last message only when the channel has one', () => {
		expect(mountCard().find('.offer-last-message').exists()).toBe(false);

		const withMessage = mountCard({
			content: buildContent({
				kind: OfferKind.Chat,
				body: 'Hello there',
			}),
		});
		expect(withMessage.find('.offer-last-message__text').text()).toBe(
			'Hello there',
		);
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
