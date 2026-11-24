import { mount } from '@vue/test-utils';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@webitel/ui-sdk/components', () => ({
	WtButton: {
		name: 'WtButton',
		props: [
			'icon',
		],
		emits: [
			'click',
		],
		template:
			'<button :class="\'button-\' + icon" @click="$emit(\'click\')" />',
	},
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

// the form is covered on its own; here it only has to show up and report back
vi.mock('../contact-card-communication-add-form.vue', () => ({
	default: {
		name: 'ContactCardCommunicationAddForm',
		props: [
			'tab',
			'contactId',
			'isFirst',
		],
		emits: [
			'saved',
			'cancel',
		],
		template: '<form class="add-form-stub" />',
	},
}));

import ContactCardCommunication from '../contact-card-communication.vue';
import ContactCardCommunicationItem from '../contact-card-communication-item.vue';

const contact: WebitelContactsContact = {
	id: '15',
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

	describe('adding a record (AC_07.07.08, AC_07.07.09)', () => {
		const addButtonOf = (wrapper: Wrapper) => wrapper.find('.button-plus');
		const formOf = (wrapper: Wrapper) =>
			wrapper.findComponent({
				name: 'ContactCardCommunicationAddForm',
			});
		const openForm = async (wrapper: Wrapper) => {
			await addButtonOf(wrapper).trigger('click');
		};

		it('offers adding on Phones and Emails, not on Messaging', async () => {
			const isHidden = (wrapper: Wrapper) => {
				const button = addButtonOf(wrapper);
				const hidden = button.classes(
					'contact-card-communication__add--hidden',
				);
				// an invisible button must not take clicks or focus either
				expect(button.attributes('inert') !== undefined).toBe(hidden);
				return hidden;
			};
			const wrapper = mountSection();
			expect(isHidden(wrapper)).toBe(false);

			await selectTab(wrapper, 'messaging');
			// kept in place so the tab row does not change height
			expect(addButtonOf(wrapper).exists()).toBe(true);
			expect(isHidden(wrapper)).toBe(true);

			await selectTab(wrapper, 'emails');
			expect(isHidden(wrapper)).toBe(false);
		});

		it('opens the form for the current tab and contact', async () => {
			const wrapper = mountSection();
			expect(formOf(wrapper).exists()).toBe(false);

			await openForm(wrapper);

			expect(formOf(wrapper).props()).toEqual({
				tab: 'phones',
				contactId: '15',
				isFirst: false,
			});
			expect(itemsOf(wrapper)).toHaveLength(1);
		});

		it('makes the first record of a tab primary', async () => {
			const wrapper = mountSection({
				id: '15',
			});

			await openForm(wrapper);

			expect(formOf(wrapper).props('isFirst')).toBe(true);
		});

		it('keeps one form open on a second click of add', async () => {
			const wrapper = mountSection();

			await openForm(wrapper);
			await openForm(wrapper);

			expect(
				wrapper.findAllComponents({
					name: 'ContactCardCommunicationAddForm',
				}),
			).toHaveLength(1);
		});

		it('closes the form on cancel', async () => {
			const wrapper = mountSection();
			await openForm(wrapper);

			formOf(wrapper).vm.$emit('cancel');
			await wrapper.vm.$nextTick();

			expect(formOf(wrapper).exists()).toBe(false);
			expect(wrapper.emitted('changed')).toBeUndefined();
		});

		it('closes the form and reports the change once saved', async () => {
			const wrapper = mountSection();
			await openForm(wrapper);

			formOf(wrapper).vm.$emit('saved');
			await wrapper.vm.$nextTick();

			expect(formOf(wrapper).exists()).toBe(false);
			expect(wrapper.emitted('changed')).toHaveLength(1);
		});

		it('drops the form when the agent switches tabs', async () => {
			const wrapper = mountSection();
			await openForm(wrapper);

			await selectTab(wrapper, 'emails');

			expect(formOf(wrapper).exists()).toBe(false);
		});

		it('drops the form when another contact is shown', async () => {
			const wrapper = mountSection();
			await openForm(wrapper);

			await wrapper.setProps({
				contact: {
					...contact,
					id: '16',
				},
			});

			expect(formOf(wrapper).exists()).toBe(false);
		});

		it('keeps the form when the same contact is reloaded', async () => {
			const wrapper = mountSection();
			await openForm(wrapper);

			await wrapper.setProps({
				contact: {
					...contact,
				},
			});

			expect(formOf(wrapper).exists()).toBe(true);
		});
	});
});
