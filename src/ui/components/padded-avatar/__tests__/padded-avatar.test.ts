import { mount } from '@vue/test-utils';
import { WtAvatar } from '@webitel/ui-sdk/components';
import { describe, expect, it } from 'vitest';

import PaddedAvatar from '../padded-avatar.vue';

describe('padded-avatar', () => {
	it.each([
		'xs',
		'sm',
	] as const)('passes the %s size to the avatar and the padding', (size) => {
		const wrapper = mount(PaddedAvatar, {
			props: {
				size,
			},
		});

		expect(wrapper.findComponent(WtAvatar).props('size')).toBe(size);
		expect(wrapper.classes()).toContain(`padded-avatar--${size}`);
	});

	it('passes the username and the picture to the avatar', () => {
		const wrapper = mount(PaddedAvatar, {
			props: {
				size: 'sm',
				username: 'John Smith',
				src: 'avatar.png',
			},
		});

		const avatar = wrapper.findComponent(WtAvatar);

		expect(avatar.props('username')).toBe('John Smith');
		expect(avatar.props('src')).toBe('avatar.png');
	});
});
