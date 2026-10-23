import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { ActiveCallContent } from '../../types/ActiveCallContent.types';
import FloatingCallWidget from '../floating-call-widget.vue';

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
	isPostProcessingEnabled: true,
	...overrides,
});

const mountBar = (preview: ActiveCallContent = buildPreview()) =>
	mount(FloatingCallWidget, {
		props: {
			preview,
			elapsedTime: '00:01:05',
		},
		global: {
			stubs: {
				'wt-avatar': true,
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

describe('floating-call-widget', () => {
	it('shows the elapsed time it is given', () => {
		const wrapper = mountBar();

		expect(wrapper.find('.floating-call-widget__timer').text()).toBe(
			'00:01:05',
		);
	});

	it('asks to expand when the avatar and timer area is clicked', async () => {
		const wrapper = mountBar();

		await wrapper.find('.floating-call-widget__toggle').trigger('click');

		expect(wrapper.emitted('toggleExpand')).toHaveLength(1);
	});

	it('shows the full view button when the call allows post-processing', () => {
		const wrapper = mountBar();

		expect(wrapper.find('.button').exists()).toBe(true);
	});

	it('hides the full view button when the call has no post-processing', () => {
		const wrapper = mountBar(
			buildPreview({
				isPostProcessingEnabled: false,
			}),
		);

		expect(wrapper.find('.button').exists()).toBe(false);
	});

	it('is not marked as on hold while the call is live', () => {
		const wrapper = mountBar();

		expect(wrapper.classes()).not.toContain('floating-call-widget--hold');
	});

	it('is marked as on hold when the call is held', () => {
		const wrapper = mountBar(
			buildPreview({
				isHold: true,
			}),
		);

		expect(wrapper.classes()).toContain('floating-call-widget--hold');
	});
});
