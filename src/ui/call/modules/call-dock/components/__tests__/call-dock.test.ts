import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { ActiveCallContent } from '../../types/ActiveCallContent.types';
import CallDock from '../call-dock.vue';
import CallDockActions from '../call-dock-actions.vue';
import CallDockNumpad from '../call-dock-numpad.vue';

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

const mountCard = (preview: ActiveCallContent = buildPreview()) =>
	mount(CallDock, {
		props: {
			preview,
			elapsedTime: '00:05:52',
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
				'wt-icon': {
					props: [
						'icon',
					],
					template: '<i class="icon" :data-icon="icon" />',
				},
			},
		},
	});

describe('call-dock', () => {
	it('shows the contact, the number and the queue', () => {
		const wrapper = mountCard();

		expect(wrapper.find('.call-dock__identity').text()).toContain(
			'Emily Johnson',
		);
		expect(wrapper.find('.call-dock__identity').text()).toContain(
			'+12023417842',
		);
		expect(wrapper.find('.call-dock__queue').text()).toContain('Sales');
	});

	it('hides the queue line for a call outside a queue', () => {
		const wrapper = mountCard(
			buildPreview({
				queueName: undefined,
			}),
		);

		expect(wrapper.find('.call-dock__queue').exists()).toBe(false);
	});

	it('shows the in-call status with the elapsed time', () => {
		const wrapper = mountCard();

		expect(wrapper.find('.call-dock__status').text()).toContain(
			'ui.call.activeCall.inCall',
		);
		expect(wrapper.find('.call-dock__status').text()).toContain('00:05:52');
	});

	it('shows the on-hold status when the call is held', () => {
		const wrapper = mountCard(
			buildPreview({
				isHold: true,
			}),
		);

		expect(wrapper.find('.call-dock__status').text()).toContain(
			'ui.call.activeCall.onHold',
		);
	});

	it('shows the open-full-view button for every call and emits from it', async () => {
		const wrapper = mountCard();
		const button = wrapper.find('[data-icon="ws-open-full-view"]');

		expect(button.exists()).toBe(true);

		await button.trigger('click');

		expect(wrapper.emitted('openFullView')).toHaveLength(1);
	});

	it('toggles the numpad from the numpad action', async () => {
		const wrapper = mountCard();
		expect(wrapper.findComponent(CallDockNumpad).exists()).toBe(false);

		wrapper.findComponent(CallDockActions).vm.$emit('toggleNumpad');
		await wrapper.vm.$nextTick();
		expect(wrapper.findComponent(CallDockNumpad).exists()).toBe(true);

		wrapper.findComponent(CallDockActions).vm.$emit('toggleNumpad');
		await wrapper.vm.$nextTick();
		expect(wrapper.findComponent(CallDockNumpad).exists()).toBe(false);
	});

	it('forwards the sent digit', async () => {
		const wrapper = mountCard();
		wrapper.findComponent(CallDockActions).vm.$emit('toggleNumpad');
		await wrapper.vm.$nextTick();

		wrapper.findComponent(CallDockNumpad).vm.$emit('digit', '5');

		expect(wrapper.emitted('sendDigit')).toEqual([
			[
				'5',
			],
		]);
	});

	it('shows the DTMF digits of the call in the numpad', async () => {
		const wrapper = mountCard(
			buildPreview({
				dtmfDigits: '12#',
			}),
		);
		wrapper.findComponent(CallDockActions).vm.$emit('toggleNumpad');
		await wrapper.vm.$nextTick();

		expect(wrapper.findComponent(CallDockNumpad).props('digits')).toBe('12#');
	});

	it('forwards the call actions', () => {
		const wrapper = mountCard();
		const actions = wrapper.findComponent(CallDockActions);

		actions.vm.$emit('toggleMute');
		actions.vm.$emit('toggleHold');
		actions.vm.$emit('hangup');

		expect(wrapper.emitted('toggleMute')).toHaveLength(1);
		expect(wrapper.emitted('toggleHold')).toHaveLength(1);
		expect(wrapper.emitted('hangup')).toHaveLength(1);
	});
});
