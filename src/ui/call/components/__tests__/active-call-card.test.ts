import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { ActiveCallPreview } from '../../types/ActiveCallPreview.types';
import ActiveCallActions from '../active-call-actions.vue';
import ActiveCallCard from '../active-call-card.vue';
import ActiveCallNumpad from '../active-call-numpad.vue';

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

const mountCard = (preview: ActiveCallPreview = buildPreview()) =>
	mount(ActiveCallCard, {
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

describe('active-call-card', () => {
	it('shows the contact, the number and the queue', () => {
		const wrapper = mountCard();

		expect(wrapper.find('.active-call-card__identity').text()).toContain(
			'Emily Johnson',
		);
		expect(wrapper.find('.active-call-card__identity').text()).toContain(
			'+12023417842',
		);
		expect(wrapper.find('.active-call-card__queue').text()).toContain('Sales');
	});

	it('hides the queue line for a call outside a queue', () => {
		const wrapper = mountCard(
			buildPreview({
				queueName: undefined,
			}),
		);

		expect(wrapper.find('.active-call-card__queue').exists()).toBe(false);
	});

	it('shows the in-call status with the elapsed time', () => {
		const wrapper = mountCard();

		expect(wrapper.find('.active-call-card__status').text()).toContain(
			'ui.call.activeCall.inCall',
		);
		expect(wrapper.find('.active-call-card__status').text()).toContain(
			'00:05:52',
		);
	});

	it('shows the on-hold status when the call is held', () => {
		const wrapper = mountCard(
			buildPreview({
				isHold: true,
			}),
		);

		expect(wrapper.find('.active-call-card__status').text()).toContain(
			'ui.call.activeCall.onHold',
		);
	});

	it('shows the open-full-view button only when post-processing is enabled', () => {
		expect(mountCard().find('[data-icon="ws-open-full-view"]').exists()).toBe(
			true,
		);
		expect(
			mountCard(
				buildPreview({
					isPostProcessingEnabled: false,
				}),
			)
				.find('[data-icon="ws-open-full-view"]')
				.exists(),
		).toBe(false);
	});

	it('toggles the numpad from the numpad action', async () => {
		const wrapper = mountCard();
		expect(wrapper.findComponent(ActiveCallNumpad).exists()).toBe(false);

		wrapper.findComponent(ActiveCallActions).vm.$emit('toggleNumpad');
		await wrapper.vm.$nextTick();
		expect(wrapper.findComponent(ActiveCallNumpad).exists()).toBe(true);

		wrapper.findComponent(ActiveCallActions).vm.$emit('toggleNumpad');
		await wrapper.vm.$nextTick();
		expect(wrapper.findComponent(ActiveCallNumpad).exists()).toBe(false);
	});

	it('forwards the sent digit', async () => {
		const wrapper = mountCard();
		wrapper.findComponent(ActiveCallActions).vm.$emit('toggleNumpad');
		await wrapper.vm.$nextTick();

		wrapper.findComponent(ActiveCallNumpad).vm.$emit('digit', '5');

		expect(wrapper.emitted('sendDigit')).toEqual([
			[
				'5',
			],
		]);
	});

	it('forwards the call actions', () => {
		const wrapper = mountCard();
		const actions = wrapper.findComponent(ActiveCallActions);

		actions.vm.$emit('toggleMute');
		actions.vm.$emit('toggleHold');
		actions.vm.$emit('hangup');

		expect(wrapper.emitted('toggleMute')).toHaveLength(1);
		expect(wrapper.emitted('toggleHold')).toHaveLength(1);
		expect(wrapper.emitted('hangup')).toHaveLength(1);
	});
});
