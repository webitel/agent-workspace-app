import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import LastMessageText from '../last-message-text.vue';

describe('last-message-text', () => {
	it('shows the text', () => {
		const wrapper = mount(LastMessageText, {
			props: {
				text: 'Hi there!',
				sender: 'client',
			},
		});

		expect(wrapper.find('.last-message-text__body').text()).toBe('Hi there!');
	});

	// AC_02.03.01
	it.each([
		[
			'client',
			true,
			'last-message-text--client-unread',
		],
		[
			'client',
			false,
			'last-message-text--client-read',
		],
		[
			'agent',
			true,
			'last-message-text--agent',
		],
		[
			'agent',
			false,
			'last-message-text--agent',
		],
	] as const)('a %s message, unread: %s, takes the %s look', (sender, isUnread, look) => {
		const wrapper = mount(LastMessageText, {
			props: {
				text: 'Hi there!',
				sender,
				isUnread,
			},
		});

		expect(wrapper.classes()).toContain(look);
	});
});
