import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { OfferSource } from '../../../types/Offer.types';
import OfferSourceLine from '../offer-source-line.vue';
import OfferVariables from '../offer-variables.vue';

const buildVariables = (count: number): OfferSource[] =>
	Array.from(
		{
			length: count,
		},
		(_, index) => ({
			label: `key${index}`,
			value: `value${index}`,
		}),
	);

const mountVariables = (count: number) =>
	mount(OfferVariables, {
		props: {
			variables: buildVariables(count),
		},
	});

describe('offer-variables', () => {
	// AC_06.01.06: nothing hidden, nothing to toggle
	it('shows every variable and no toggle while they all fit', () => {
		const wrapper = mountVariables(3);

		expect(wrapper.findAllComponents(OfferSourceLine)).toHaveLength(3);
		expect(wrapper.find('.offer-variables__toggle').exists()).toBe(false);
	});

	it('collapses to the first three and expands on the toggle', async () => {
		const wrapper = mountVariables(5);

		expect(wrapper.findAllComponents(OfferSourceLine)).toHaveLength(3);

		await wrapper.find('.offer-variables__toggle').trigger('click');

		expect(wrapper.findAllComponents(OfferSourceLine)).toHaveLength(5);
	});

	// a chat's card body opens the chat on click (AC_06.01.04)
	it('keeps the toggle click from reaching the card body', async () => {
		const parent = mount({
			components: {
				OfferVariables,
			},
			data: () => ({
				clicks: 0,
				variables: buildVariables(4),
			}),
			template:
				'<div @click="clicks++"><offer-variables :variables="variables" /></div>',
		});

		await parent.find('.offer-variables__toggle').trigger('click');

		expect(parent.vm.clicks).toBe(0);
	});
});
