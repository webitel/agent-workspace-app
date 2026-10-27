import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SlideUpOverlay from '../slide-up-overlay.vue';

const mountOverlay = (isOpen: boolean) =>
	mount(SlideUpOverlay, {
		props: {
			isOpen,
		},
		slots: {
			default: '<span class="content">content</span>',
		},
		global: {
			stubs: {
				transition: false,
			},
		},
	});

describe('slide-up-overlay', () => {
	it('renders nothing while closed', () => {
		const wrapper = mountOverlay(false);

		expect(wrapper.find('.content').exists()).toBe(false);
	});

	it('renders the slot while open', () => {
		const wrapper = mountOverlay(true);

		expect(wrapper.find('.slide-up-overlay .content').exists()).toBe(true);
	});
});
