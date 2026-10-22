import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { ActiveCallPreview } from '../../types/ActiveCallPreview.types';
import ActiveCallBar from '../active-call-bar.vue';

const buildPreview = (
	overrides: Partial<ActiveCallPreview> = {},
): ActiveCallPreview => ({
	name: 'Emily Johnson',
	number: '+12023417842',
	queueName: 'Sales',
	answeredAt: Date.now(),
	isHold: false,
	isMuted: false,
	...overrides,
});

const mountBar = (expanded = false) =>
	mount(ActiveCallBar, {
		props: {
			preview: buildPreview(),
			expanded,
		},
		global: {
			stubs: {
				'wt-avatar': true,
				'wt-chip': {
					template: '<span class="chip"><slot /></span>',
				},
				'wt-input-text': true,
				'wt-button': {
					template: '<button class="button"><slot /></button>',
				},
				'wt-icon': true,
			},
		},
	});

describe('active-call-bar', () => {
	it('shows the pill and no card while collapsed', () => {
		const wrapper = mountBar();

		expect(wrapper.find('.floating-call-widget').exists()).toBe(true);
		expect(wrapper.find('.active-call-card').exists()).toBe(false);
	});

	it('shows the card above the pill while expanded', () => {
		const wrapper = mountBar(true);

		expect(wrapper.find('.floating-call-widget').exists()).toBe(true);
		expect(wrapper.find('.active-call-card').exists()).toBe(true);
	});

	it('shows the same time in the pill and in the card', () => {
		const wrapper = mountBar(true);

		const pillTime = wrapper.find('.floating-call-widget__timer').text();

		expect(wrapper.find('.active-call-card__status').text()).toContain(
			pillTime,
		);
	});

	it('asks to expand when the pill is clicked', async () => {
		const wrapper = mountBar();

		await wrapper.find('.floating-call-widget__toggle').trigger('click');

		expect(wrapper.emitted('toggleExpand')).toHaveLength(1);
	});

	it('collapses on a click outside the opened card', async () => {
		const wrapper = mountBar(true);

		document.body.click();
		await wrapper.vm.$nextTick();

		expect(wrapper.emitted('collapse')).toHaveLength(1);
	});

	it('does not emit collapse on an outside click while collapsed', async () => {
		const wrapper = mountBar();

		document.body.click();
		await wrapper.vm.$nextTick();

		expect(wrapper.emitted('collapse')).toBeUndefined();
	});
});
