import { mount } from '@vue/test-utils';
import { WtButton } from '@webitel/ui-sdk/components';
import { describe, expect, it } from 'vitest';
import ContactCard from '../../../components/contact/contact-card.vue';
import ContactCreateForm from '../../../components/contact/contact-create-form.vue';
import ContactPanelEmpty from '../../../components/contact/contact-panel-empty.vue';
import SidebarSectionHeader from '../../../components/sidebar-section-header.vue';
import ContactsSidebarPanel from '../contacts-sidebar-panel.vue';

const ContactPanelEmptyStub = {
	props: [
		'title',
		'text',
	],
	template: '<div><slot name="actions" /></div>',
};

const mountPanel = (props: { contactId?: string } = {}) =>
	mount(ContactsSidebarPanel, {
		props,
		global: {
			stubs: {
				ContactPanelEmpty: ContactPanelEmptyStub,
			},
		},
	});

const getTitle = (wrapper: ReturnType<typeof mountPanel>) =>
	wrapper.findComponent(SidebarSectionHeader).props('title');

const openCreateForm = async (wrapper: ReturnType<typeof mountPanel>) => {
	await wrapper
		.findComponent(ContactPanelEmpty)
		.findComponent(WtButton)
		.vm.$emit('click');
};

describe('ContactsSidebarPanel', () => {
	it('shows the empty state with the Contacts title when no contact is selected', () => {
		const wrapper = mountPanel();

		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(true);
		expect(wrapper.findComponent(ContactCreateForm).exists()).toBe(false);
		expect(wrapper.findComponent(ContactCard).exists()).toBe(false);
		expect(getTitle(wrapper)).toBe('objects.contact');
	});

	it('opens the create form with the Add contacts title on CREATE click', async () => {
		const wrapper = mountPanel();

		await openCreateForm(wrapper);

		expect(wrapper.findComponent(ContactCreateForm).exists()).toBe(true);
		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(false);
		expect(getTitle(wrapper)).toBe('ui.sidebar.contact.addContacts');
	});

	it('returns to the empty state when the create form is cancelled', async () => {
		const wrapper = mountPanel();
		await openCreateForm(wrapper);

		await wrapper.findComponent(ContactCreateForm).vm.$emit('cancel');

		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(true);
		expect(wrapper.findComponent(ContactCreateForm).exists()).toBe(false);
		expect(getTitle(wrapper)).toBe('objects.contact');
	});

	it('shows the contact card with the Profile title when a contact is selected', () => {
		const wrapper = mountPanel({
			contactId: '1',
		});

		expect(wrapper.findComponent(ContactCard).props('contactId')).toBe('1');
		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(false);
		expect(getTitle(wrapper)).toBe('ui.sidebar.contact.profile');
	});

	it('closes the create form when a new contact is selected', async () => {
		const wrapper = mountPanel();
		await openCreateForm(wrapper);

		await wrapper.setProps({
			contactId: '2',
		});

		expect(wrapper.findComponent(ContactCreateForm).exists()).toBe(false);
		expect(wrapper.findComponent(ContactCard).props('contactId')).toBe('2');
		expect(getTitle(wrapper)).toBe('ui.sidebar.contact.profile');
	});
});
