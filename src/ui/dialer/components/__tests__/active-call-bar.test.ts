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

const mountBar = (props: { preview?: ActiveCallPreview; expanded?: boolean }) =>
	mount(ActiveCallBar, {
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
				'wt-button': true,
				'task-top-bar': {
					props: [
						'name',
						'subtitle',
					],
					template:
						'<div class="top-bar">{{ name }} {{ subtitle }}<slot name="status" /></div>',
				},
			},
		},
	});

const findIconBtn = (wrapper: ReturnType<typeof mountBar>, icon: string) =>
	wrapper.find(`[data-icon="${icon}"]`);

describe('active-call-bar', () => {
	it('shows the collapsed pill with the call status', () => {
		const wrapper = mountBar({});

		expect(wrapper.find('.active-call-bar__pill').text()).toContain(
			'ui.dialer.activeCall.inCall',
		);
		expect(wrapper.find('.active-call-bar__card').exists()).toBe(false);
	});

	it('marks the pill and the status as on hold', () => {
		const wrapper = mountBar({
			preview: buildPreview({
				isHold: true,
			}),
		});

		expect(wrapper.find('.active-call-bar__pill--hold').exists()).toBe(true);
		expect(wrapper.text()).toContain('ui.dialer.activeCall.onHold');
	});

	it('asks to expand when the pill is clicked', async () => {
		const wrapper = mountBar({});

		await wrapper.find('.active-call-bar__pill').trigger('click');

		expect(wrapper.emitted('toggleExpand')).toHaveLength(1);
	});

	it('shows the contact, the number and the queue when expanded', () => {
		const wrapper = mountBar({
			expanded: true,
		});

		expect(wrapper.find('.top-bar').text()).toContain('Emily Johnson');
		expect(wrapper.find('.top-bar').text()).toContain('+12023417842');
		expect(wrapper.find('.active-call-bar__queue').text()).toContain('Sales');
	});

	it('hides the queue line for a call outside a queue', () => {
		const wrapper = mountBar({
			expanded: true,
			preview: buildPreview({
				queueName: undefined,
			}),
		});

		expect(wrapper.find('.active-call-bar__queue').exists()).toBe(false);
	});

	it('emits the call actions from the icon row', async () => {
		const wrapper = mountBar({
			expanded: true,
		});

		await findIconBtn(wrapper, 'mic').trigger('click');
		await findIconBtn(wrapper, 'hold').trigger('click');
		await findIconBtn(wrapper, 'call-end').trigger('click');

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
