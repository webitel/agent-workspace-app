import { mount } from '@vue/test-utils';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { describe, expect, it } from 'vitest';
import ContactCardHeader from '../contact-card-header.vue';

const WtAvatarStub = {
	name: 'WtAvatar',
	props: [
		'username',
	],
	template: '<div class="wt-avatar-stub" />',
};

const WtChipStub = {
	name: 'WtChip',
	template: '<span class="wt-chip-stub"><slot /></span>',
};

const mountHeader = (contact: WebitelContactsContact) =>
	mount(ContactCardHeader, {
		props: {
			contact,
		},
		global: {
			stubs: {
				WtAvatar: WtAvatarStub,
				WtChip: WtChipStub,
			},
		},
	});

describe('ContactCardHeader', () => {
	it('renders letter avatar and name from commonName', () => {
		const wrapper = mountHeader({
			name: {
				commonName: 'John Doe',
			},
		});

		expect(wrapper.findComponent(WtAvatarStub).props('username')).toBe(
			'John Doe',
		);
		expect(wrapper.find('.contact-card-header__name').text()).toBe('John Doe');
	});

	it('renders each label in its own chip', () => {
		const wrapper = mountHeader({
			name: {
				commonName: 'John Doe',
			},
			labels: {
				data: [
					{
						label: 'VIP',
					},
					{
						label: 'Partner',
					},
				],
			},
		});

		const chips = wrapper.findAllComponents(WtChipStub);
		expect(chips.map((chip) => chip.text())).toEqual([
			'VIP',
			'Partner',
		]);
	});

	it('does not render labels block when contact has no labels', () => {
		const wrapper = mountHeader({
			name: {
				commonName: 'John Doe',
			},
			labels: {
				data: [],
			},
		});

		expect(wrapper.find('.contact-card-header__labels').exists()).toBe(false);
	});
});
