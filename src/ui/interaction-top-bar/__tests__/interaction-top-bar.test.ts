import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('vue-i18n', () => ({
	useI18n: () => ({
		t: (key: string) => key,
	}),
}));

import InteractionTopBar from '../interaction-top-bar.vue';

const mountBar = (props = {}, slots: Record<string, string> = {}) =>
	mount(InteractionTopBar, {
		props,
		slots,
		global: {
			stubs: {
				'wt-avatar': {
					props: [
						'username',
					],
					template: '<i class="avatar">{{ username }}</i>',
				},
			},
		},
	});

describe('interaction-top-bar', () => {
	it('shows the name and the subtitle beside the avatar', () => {
		const wrapper = mountBar({
			name: 'client_username',
			subtitle: 'Support',
		});

		expect(wrapper.find('.avatar').text()).toBe('client_username');
		expect(wrapper.text()).toContain('client_username');
		expect(wrapper.text()).toContain('Support');
	});

	it('names an unknown contact rather than leaving the name blank', () => {
		const wrapper = mountBar();

		expect(wrapper.text()).toContain('ui.notifications.offer.unknownContact');
	});

	it('renders no subtitle line when there is none', () => {
		expect(
			mountBar({
				name: 'Jane',
			})
				.find('.interaction-top-bar__subtitle')
				.exists(),
		).toBe(false);
	});

	it('leaves the timer and the actions to the channel that owns them', () => {
		const wrapper = mountBar(
			{
				name: 'Jane',
			},
			{
				leading: '<b class="leading" />',
				status: '<b class="status" />',
				actions: '<b class="actions" />',
			},
		);

		expect(wrapper.find('.leading').exists()).toBe(true);
		expect(wrapper.find('.status').exists()).toBe(true);
		expect(wrapper.find('.actions').exists()).toBe(true);
	});
});
