import { mount } from '@vue/test-utils';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@webitel/ui-sdk/components', () => ({
	WtTabs: {
		name: 'WtTabs',
		props: [
			'current',
			'tabs',
		],
		emits: [
			'change',
		],
		template: '<nav class="wt-tabs-stub" />',
	},
}));

import ContactCardCommunication from '../contact-card-communication.vue';
import ContactCardCommunicationItem from '../contact-card-communication-item.vue';

const contact: WebitelContactsContact = {
	phones: {
		data: [
			{
				id: '403',
				number: '380991358573',
			},
		],
	},
	imclients: {
		data: [
			{
				id: '1316',
				protocol: 'telegram',
				user: {
					name: 'Polina polinasukhorukova',
				},
			},
		],
	},
	emails: {
		data: [
			{
				id: '225',
				email: 'polina.agent@gmail.com',
			},
		],
	},
};

const mountSection = (value: WebitelContactsContact = contact) =>
	mount(ContactCardCommunication, {
		props: {
			contact: value,
		},
		global: {
			stubs: {
				'wt-icon': true,
			},
		},
	});

type Wrapper = ReturnType<typeof mountSection>;

const tabsOf = (wrapper: Wrapper) =>
	wrapper.findComponent({
		name: 'WtTabs',
	});

const itemsOf = (wrapper: Wrapper) =>
	wrapper
		.findAllComponents(ContactCardCommunicationItem)
		.map((item) => item.props('item'));

const selectTab = async (wrapper: Wrapper, value: string) => {
	const tab = (
		tabsOf(wrapper).props('tabs') as {
			value: string;
		}[]
	).find((item) => item.value === value);
	tabsOf(wrapper).vm.$emit('change', tab);
	await wrapper.vm.$nextTick();
};

describe('ContactCardCommunication', () => {
	it('renders the title and the Phones / Messaging / Emails tabs', () => {
		const wrapper = mountSection();

		expect(wrapper.text()).toContain('ui.sidebar.contact.communicationOptions');
		expect(tabsOf(wrapper).props('tabs')).toEqual([
			{
				value: 'phones',
				text: 'vocabulary.phones',
			},
			{
				value: 'messaging',
				text: 'vocabulary.messaging',
			},
			{
				value: 'emails',
				text: 'vocabulary.emails',
			},
		]);
	});

	it('opens on Phones', () => {
		const wrapper = mountSection();

		expect(tabsOf(wrapper).props('current')).toEqual({
			value: 'phones',
			text: 'vocabulary.phones',
		});
		expect(itemsOf(wrapper)).toEqual([
			{
				id: '403',
				value: '380991358573',
				icon: 'call--filled',
			},
		]);
	});

	it('shows the messengers on Messaging', async () => {
		const wrapper = mountSection();

		await selectTab(wrapper, 'messaging');

		expect(tabsOf(wrapper).props('current')).toEqual({
			value: 'messaging',
			text: 'vocabulary.messaging',
		});
		expect(itemsOf(wrapper)).toEqual([
			{
				id: '1316',
				value: 'Polina polinasukhorukova',
				icon: 'telegram-bot',
			},
		]);
	});

	it('shows the emails on Emails', async () => {
		const wrapper = mountSection();

		await selectTab(wrapper, 'emails');

		expect(itemsOf(wrapper)).toEqual([
			{
				id: '225',
				value: 'polina.agent@gmail.com',
				icon: 'ws-navigation-email',
			},
		]);
	});

	it('renders an empty list for a tab without records', () => {
		const wrapper = mountSection({});

		expect(wrapper.find('ul').exists()).toBe(true);
		expect(itemsOf(wrapper)).toEqual([]);
	});
});
