import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import unknownContactAvatar from '../../../../../app/assets/ws-unknown-contact-avatar.svg';
import ContactCardUnknown from '../contact-card-unknown.vue';

const WtAvatarStub = {
	name: 'WtAvatar',
	props: [
		'src',
	],
	template: '<div class="wt-avatar-stub" />',
};

describe('contact-card-unknown', () => {
	it('shows the unknown contact avatar and the Unknown contact name', () => {
		const wrapper = mount(ContactCardUnknown, {
			global: {
				stubs: {
					WtAvatar: WtAvatarStub,
				},
			},
		});

		expect(wrapper.findComponent(WtAvatarStub).props('src')).toBe(
			unknownContactAvatar,
		);
		expect(wrapper.find('.contact-card-unknown__name').text()).toBe(
			'ui.clientIdentity.unknownContact',
		);
	});
});
