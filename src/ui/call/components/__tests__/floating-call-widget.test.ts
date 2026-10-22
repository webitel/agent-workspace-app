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
	...overrides,
});

const mountWidget = (preview: ActiveCallPreview = buildPreview()) =>
	mount(FloatingCallWidget, {
		props: {
			preview,
			elapsedTime: '00:05:52',
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
		const wrapper = mountWidget();

		expect(wrapper.find('.floating-call-widget__timer').text()).toBe(
			'00:05:52',
		);
	});

	it('asks to expand when the toggle is clicked', async () => {
		const wrapper = mountWidget();

		await wrapper.find('.floating-call-widget__toggle').trigger('click');

		expect(wrapper.emitted('toggleExpand')).toHaveLength(1);
	});

	it('does not ask to expand when the full view button is clicked', async () => {
		const wrapper = mountWidget();

		await wrapper.find('.button').trigger('click');

		expect(wrapper.emitted('toggleExpand')).toBeUndefined();
	});

	it('marks the widget as on hold', () => {
		const wrapper = mountWidget(
			buildPreview({
				isHold: true,
			}),
		);

		expect(wrapper.find('.floating-call-widget--hold').exists()).toBe(true);
	});

	it('asks to open the full view from its button', async () => {
		const wrapper = mountWidget();
		expect(wrapper.find('[data-icon="ws-open-full-view"]').exists()).toBe(true);

		await wrapper.find('.button').trigger('click');

		expect(wrapper.emitted('openFullView')).toHaveLength(1);
	});
});
