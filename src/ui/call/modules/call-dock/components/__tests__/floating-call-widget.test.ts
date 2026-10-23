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
	...overrides,
});

const mountBar = (preview: ActiveCallContent = buildPreview()) =>
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

	it('emits openFullView from its button', async () => {
		const wrapper = mountBar();

		await wrapper.find('.button').trigger('click');

		expect(wrapper.emitted('openFullView')).toHaveLength(1);
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
