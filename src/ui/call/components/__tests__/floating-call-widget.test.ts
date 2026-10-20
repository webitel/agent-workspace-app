import { mount } from '@vue/test-utils';
import { IconColor } from '@webitel/ui-sdk/enums';
import { describe, expect, it } from 'vitest';

import type { ActiveCallPreview } from '../../types/ActiveCallPreview.types';
import FloatingCallWidget from '../floating-call-widget.vue';

const buildPreview = (
	overrides: Partial<ActiveCallPreview> = {},
): ActiveCallPreview => ({
	name: 'Emily Johnson',
	number: '+12023417842',
	queueName: 'Sales',
	answeredAt: Date.now(),
	isHold: false,
	isMuted: false,
	isPostProcessingEnabled: true,
	...overrides,
});

const mountBar = (props: { preview?: ActiveCallPreview; expanded?: boolean }) =>
	mount(FloatingCallWidget, {
		props: {
			preview: buildPreview(),
			expanded: false,
			...props,
		},
		global: {
			stubs: {
				'wt-avatar': true,
				'wt-chip': {
					template: '<span class="chip"><slot /></span>',
				},
				'wt-icon-btn': {
					props: [
						'icon',
					],
					template: '<button class="icon-btn" :data-icon="icon" />',
				},
				'wt-input-text': true,
				'wt-button': {
					template: '<button class="button"><slot /></button>',
				},
				'wt-icon': {
					props: [
						'icon',
						'color',
					],
					template: '<i class="icon" :data-icon="icon" :data-color="color" />',
				},
			},
		},
	});

const findIconBtn = (wrapper: ReturnType<typeof mountBar>, icon: string) =>
	wrapper.find(`[data-icon="${icon}"]`);

describe('floating-call-widget', () => {
	it('shows the collapsed pill with the call timer and no card', () => {
		const wrapper = mountBar({});

		expect(wrapper.find('.floating-call-widget__pill-timer').text()).toMatch(
			/^\d{2}:\d{2}:\d{2}$/,
		);
		expect(wrapper.find('.floating-call-widget__card').exists()).toBe(false);
	});

	it('shows the in-call status in the expanded card', () => {
		const wrapper = mountBar({
			expanded: true,
		});

		expect(wrapper.find('.floating-call-widget__status').text()).toContain(
			'ui.call.activeCall.inCall',
		);
	});

	it('marks the pill and the status as on hold', () => {
		const wrapper = mountBar({
			expanded: true,
			preview: buildPreview({
				isHold: true,
			}),
		});

		expect(wrapper.find('.floating-call-widget__pill--hold').exists()).toBe(
			true,
		);
		expect(wrapper.find('.floating-call-widget__status').text()).toContain(
			'ui.call.activeCall.onHold',
		);
	});

	it('asks to expand when the pill is clicked', async () => {
		const wrapper = mountBar({});

		await wrapper.find('.floating-call-widget__pill').trigger('click');

		expect(wrapper.emitted('toggleExpand')).toHaveLength(1);
	});

	it('shows the contact, the number and the queue when expanded', () => {
		const wrapper = mountBar({
			expanded: true,
		});

		expect(wrapper.find('.floating-call-widget__identity').text()).toContain(
			'Emily Johnson',
		);
		expect(wrapper.find('.floating-call-widget__identity').text()).toContain(
			'+12023417842',
		);
		expect(wrapper.find('.floating-call-widget__queue').text()).toContain(
			'Sales',
		);
	});

	it('hides the queue line for a call outside a queue', () => {
		const wrapper = mountBar({
			expanded: true,
			preview: buildPreview({
				queueName: undefined,
			}),
		});

		expect(wrapper.find('.floating-call-widget__queue').exists()).toBe(false);
	});

	it('shows the open-full-view buttons when post-processing is enabled', () => {
		const wrapper = mountBar({
			expanded: true,
		});

		expect(wrapper.findAll('[data-icon="ws-open-full-view"]')).toHaveLength(2);
	});

	it('hides the open-full-view buttons when post-processing is disabled', () => {
		const wrapper = mountBar({
			expanded: true,
			preview: buildPreview({
				isPostProcessingEnabled: false,
			}),
		});

		expect(wrapper.find('[data-icon="ws-open-full-view"]').exists()).toBe(
			false,
		);
	});

	it('emits the call actions from the icon row', async () => {
		const wrapper = mountBar({
			expanded: true,
		});

		await findIconBtn(wrapper, 'mic').trigger('click');
		await findIconBtn(wrapper, 'hold').trigger('click');
		await findIconBtn(wrapper, 'call-end--filled').trigger('click');

		expect(wrapper.emitted('toggleMute')).toHaveLength(1);
		expect(wrapper.emitted('toggleHold')).toHaveLength(1);
		expect(wrapper.emitted('hangup')).toHaveLength(1);
	});

	it('toggles the numpad with the numpad icon', async () => {
		const wrapper = mountBar({
			expanded: true,
		});
		expect(
			wrapper
				.findComponent({
					name: 'ActiveCallNumpad',
				})
				.exists(),
		).toBe(false);

		await findIconBtn(wrapper, 'numpad').trigger('click');
		expect(
			wrapper
				.findComponent({
					name: 'ActiveCallNumpad',
				})
				.exists(),
		).toBe(true);

		await findIconBtn(wrapper, 'numpad').trigger('click');
		expect(
			wrapper
				.findComponent({
					name: 'ActiveCallNumpad',
				})
				.exists(),
		).toBe(false);
	});

	it('toggles the transfer icon active on each click', async () => {
		const wrapper = mountBar({
			expanded: true,
		});
		const transferIcon = () =>
			wrapper.find('[data-icon="call-transfer--filled"]');

		const inactiveColor = transferIcon().attributes('data-color');

		await transferIcon().trigger('click');
		expect(transferIcon().attributes('data-color')).toBe(IconColor.ACTIVE);

		await transferIcon().trigger('click');
		expect(transferIcon().attributes('data-color')).toBe(inactiveColor);
	});

	it('collapses on a click outside the opened card', async () => {
		const wrapper = mountBar({
			expanded: true,
		});

		document.body.dispatchEvent(
			new MouseEvent('pointerdown', {
				bubbles: true,
			}),
		);
		document.body.click();
		await wrapper.vm.$nextTick();

		expect(wrapper.emitted('collapse')).toHaveLength(1);
	});
});
