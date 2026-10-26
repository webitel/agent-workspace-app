import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { ActiveCallContent } from '../../types/ActiveCallContent.types';
import ActiveCallTrayEntry from '../active-call-tray-entry.vue';

const buildPreview = (
	overrides: Partial<ActiveCallContent> = {},
): ActiveCallContent => ({
	name: 'Emily Johnson',
	number: '+12023417842',
	queueName: 'Sales',
	answeredAt: Date.now(),
	isHold: false,
	isMuted: false,
	dtmfDigits: '',
	...overrides,
});

const mountBar = (expanded = false) =>
	mount(ActiveCallTrayEntry, {
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

describe('active-call-tray-entry', () => {
	it('shows the pill and no dock while collapsed', () => {
		const wrapper = mountBar();

		expect(wrapper.find('.floating-call-widget').exists()).toBe(true);
		expect(wrapper.find('.call-dock').exists()).toBe(false);
	});

	it('shows the dock above the pill while expanded', () => {
		const wrapper = mountBar(true);

		expect(wrapper.find('.floating-call-widget').exists()).toBe(true);
		expect(wrapper.find('.call-dock').exists()).toBe(true);
	});

	it('shows the same time in the pill and in the dock', () => {
		const wrapper = mountBar(true);

		const pillTime = wrapper.find('.floating-call-widget__timer').text();

		expect(wrapper.find('.call-dock__status').text()).toContain(pillTime);
	});

	it('asks to expand when the collapsed pill is clicked', async () => {
		const wrapper = mountBar();

		await wrapper.find('.floating-call-widget').trigger('click');

		expect(wrapper.emitted('update:expanded')).toEqual([
			[
				true,
			],
		]);
	});

	it('asks to collapse when the expanded pill is clicked', async () => {
		const wrapper = mountBar(true);

		await wrapper.find('.floating-call-widget').trigger('click');

		expect(wrapper.emitted('update:expanded')).toEqual([
			[
				false,
			],
		]);
	});

	it('passes on openFullView from the pill', async () => {
		const wrapper = mountBar();

		await wrapper.find('.floating-call-widget .button').trigger('click');

		expect(wrapper.emitted('openFullView')).toHaveLength(1);
	});

	it('collapses on a click outside the opened dock', async () => {
		const wrapper = mountBar(true);

		document.body.click();
		await wrapper.vm.$nextTick();

		expect(wrapper.emitted('update:expanded')).toEqual([
			[
				false,
			],
		]);
	});

	it('emits nothing on an outside click while collapsed', async () => {
		const wrapper = mountBar();

		document.body.click();
		await wrapper.vm.$nextTick();

		expect(wrapper.emitted('update:expanded')).toBeUndefined();
	});
});
