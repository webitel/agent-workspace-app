import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ContactCard from '../contact-card.vue';
import ContactIdentification from '../contact-identification.vue';
import ContactPanelEmpty from '../contact-panel-empty.vue';

const WtLoaderStub = {
	name: 'WtLoader',
	template: '<div class="wt-loader-stub" />',
};

const mountBlock = (props: { contactIds: string[]; isLoading?: boolean }) =>
	mount(ContactIdentification, {
		props,
		global: {
			stubs: {
				WtLoader: WtLoaderStub,
				ContactCard: true,
				ContactPanelEmpty: true,
			},
		},
	});

describe('contact-identification', () => {
	it('shows the loader while identifying, whatever is already found', () => {
		const wrapper = mountBlock({
			contactIds: [
				'101',
			],
			isLoading: true,
		});

		expect(wrapper.findComponent(WtLoaderStub).exists()).toBe(true);
		expect(wrapper.findComponent(ContactCard).exists()).toBe(false);
	});

	it('shows the not found state when no contact matches', () => {
		const wrapper = mountBlock({
			contactIds: [],
		});

		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(true);
	});

	it('shows the card of the only match', () => {
		const wrapper = mountBlock({
			contactIds: [
				'101',
			],
		});

		expect(wrapper.findComponent(ContactCard).props('contactId')).toBe('101');
		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(false);
	});

	it('shows the placeholder for several matches instead of a card', () => {
		const wrapper = mountBlock({
			contactIds: [
				'101',
				'102',
			],
		});

		expect(wrapper.find('.contact-identification__multiple').exists()).toBe(
			true,
		);
		expect(wrapper.findComponent(ContactCard).exists()).toBe(false);
		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(false);
	});
});
