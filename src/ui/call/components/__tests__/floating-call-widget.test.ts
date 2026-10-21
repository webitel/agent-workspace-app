import { mount } from '@vue/test-utils';
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

const mountBar = (preview: ActiveCallPreview = buildPreview()) =>
	mount(FloatingCallWidget, {
		props: {
			preview,
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
	it('shows the call timer', () => {
		const wrapper = mountBar();

		expect(wrapper.find('.floating-call-widget__timer').text()).toMatch(
			/^\d{2}:\d{2}:\d{2}$/,
		);
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
