import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { OfferKind } from '../../../types/Offer.types';
import OfferKindChip from '../offer-kind-chip.vue';

describe('offer-kind-chip', () => {
	it.each([
		[
			OfferKind.Call,
			'ui.notifications.offer.title.call',
		],
		[
			OfferKind.Chat,
			'ui.notifications.offer.title.chat',
		],
	])('names the channel being offered: %s', (kind, key) => {
		const wrapper = mount(OfferKindChip, {
			props: {
				kind,
			},
		});

		expect(wrapper.text()).toContain(key);
	});

	// DES-727 asks for the info colour; it was `main` until the design review
	it('renders as an info chip', () => {
		const wrapper = mount(OfferKindChip, {
			props: {
				kind: OfferKind.Call,
			},
		});

		expect(wrapper.classes()).toContain('p-chip-info');
	});
});
