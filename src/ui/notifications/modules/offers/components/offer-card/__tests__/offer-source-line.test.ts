import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import OfferSourceLine from '../offer-source-line.vue';

const source = {
	label: 'Queue',
	value: 'Support',
};

describe('offer-source-line', () => {
	it('renders the source as `label: value`', () => {
		const wrapper = mount(OfferSourceLine, {
			props: {
				source,
			},
		});

		expect(wrapper.text().replace(/\s+/g, ' ').trim()).toBe('Queue: Support');
	});

	// the line ellipsises, so the full value has to stay reachable on hover
	it('exposes the untruncated value as a title', () => {
		const wrapper = mount(OfferSourceLine, {
			props: {
				source,
			},
		});

		expect(wrapper.attributes('title')).toBe('Support');
	});

	it('only draws an icon when one is asked for', () => {
		const withoutIcon = mount(OfferSourceLine, {
			props: {
				source,
			},
		});
		const withIcon = mount(OfferSourceLine, {
			props: {
				source,
				icon: 'chat',
			},
		});

		expect(withoutIcon.find('.wt-icon').exists()).toBe(false);
		expect(withIcon.find('.wt-icon').exists()).toBe(true);
	});
});
