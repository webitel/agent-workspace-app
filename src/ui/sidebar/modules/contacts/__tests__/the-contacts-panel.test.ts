import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { WtButton } from '@webitel/ui-sdk/components';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive, ref } from 'vue';

const route = reactive<{
	name: string;
}>({
	name: 'contacts',
});
vi.mock('vue-router', () => ({
	useRoute: () => route,
}));

const contactsList = {
	updatePage: vi.fn(),
	loadDataList: vi.fn(() => Promise.resolve()),
};
vi.mock(
	'../../../../pages/modules/contacts/modules/contacts/store/contacts',
	() => ({
		useContactsDataListStore: () => contactsList,
	}),
);

const creation = {
	isSaving: ref(false),
	createContact: vi.fn<() => Promise<string | null>>(),
};
vi.mock('../../../components/contact/composables/useContactCreation', () => ({
	useContactCreation: () => creation,
}));

import { ContactsPageTab } from '../../../../pages/modules/contacts/enums/ContactsPageTab.enum';
import ContactCard from '../../../components/contact/contact-card.vue';
import ContactCardUnknown from '../../../components/contact/contact-card-unknown.vue';
import ContactCreateForm from '../../../components/contact/contact-create-form.vue';
import ContactPanelEmpty from '../../../components/contact/contact-panel-empty.vue';
import SidebarSectionHeader from '../../../components/sidebar-section-header.vue';
import { useSidebarSelectionStore } from '../../../store/sidebar-selection';
import TheContactsPanel from '../the-contacts-panel.vue';

const ContactPanelEmptyStub = {
	props: [
		'title',
		'text',
	],
	template: '<div><slot name="actions" /></div>',
};

const ContactCreateFormStub = {
	props: [
		'isSaving',
	],
	emits: [
		'submit',
		'cancel',
	],
	template: '<div />',
};

const draft = {
	name: 'Jane Doe',
	phoneNumber: '',
	email: '',
	timezone: null,
	owner: null,
	labels: [],
	description: '',
};

const createDeferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((resolvePromise) => {
		resolve = resolvePromise;
	});
	return {
		promise,
		resolve,
	};
};

const mountPanel = () =>
	mount(TheContactsPanel, {
		global: {
			stubs: {
				ContactPanelEmpty: ContactPanelEmptyStub,
				ContactCreateForm: ContactCreateFormStub,
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

const selectContact = async (id: string) => {
	useSidebarSelectionStore().selectContact(id);
	await nextTick();
};

const selectUnknownContact = async () => {
	useSidebarSelectionStore().selectUnknownContact();
	await nextTick();
};

describe('the-contacts-panel', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		route.name = ContactsPageTab.Contacts;
		creation.isSaving.value = false;
		creation.createContact.mockReset();
		contactsList.updatePage.mockClear();
		contactsList.loadDataList.mockClear();
	});

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

	it('shows the contact card with the Profile title when a contact is selected', async () => {
		const wrapper = mountPanel();

		await selectContact('1');

		expect(wrapper.findComponent(ContactCard).props('contactId')).toBe('1');
		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(false);
		expect(getTitle(wrapper)).toBe('ui.sidebar.contact.profile');
	});

	it('closes the create form when a new contact is selected', async () => {
		const wrapper = mountPanel();
		await openCreateForm(wrapper);

		await selectContact('2');

		expect(wrapper.findComponent(ContactCreateForm).exists()).toBe(false);
		expect(wrapper.findComponent(ContactCard).props('contactId')).toBe('2');
		expect(getTitle(wrapper)).toBe('ui.sidebar.contact.profile');
	});

	it('shows the unknown contact card when an unknown contact is selected', async () => {
		const wrapper = mountPanel();

		await selectUnknownContact();

		expect(wrapper.findComponent(ContactCardUnknown).exists()).toBe(true);
		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(false);
		expect(wrapper.findComponent(ContactCard).exists()).toBe(false);
		expect(getTitle(wrapper)).toBe('objects.contact');
	});

	it('closes the create form when an unknown contact is selected', async () => {
		const wrapper = mountPanel();
		await openCreateForm(wrapper);

		await selectUnknownContact();

		expect(wrapper.findComponent(ContactCreateForm).exists()).toBe(false);
		expect(wrapper.findComponent(ContactCardUnknown).exists()).toBe(true);
	});

	it('passes the saving state to the create form', async () => {
		creation.isSaving.value = true;
		const wrapper = mountPanel();
		await openCreateForm(wrapper);

		expect(wrapper.findComponent(ContactCreateForm).props('isSaving')).toBe(
			true,
		);
	});

	it('shows the created contact and reloads the Contacts list from its first page', async () => {
		creation.createContact.mockResolvedValue('42');
		const wrapper = mountPanel();
		await openCreateForm(wrapper);

		wrapper.findComponent(ContactCreateForm).vm.$emit('submit', draft);
		await flushPromises();

		expect(creation.createContact).toHaveBeenCalledWith(draft);
		expect(wrapper.findComponent(ContactCreateForm).exists()).toBe(false);
		expect(wrapper.findComponent(ContactCard).props('contactId')).toBe('42');
		expect(contactsList.updatePage).toHaveBeenCalledWith(1);
		expect(contactsList.loadDataList).toHaveBeenCalledTimes(1);
	});

	it('does not reload the Contacts list when the contact is created on the Users tab', async () => {
		route.name = ContactsPageTab.Users;
		creation.createContact.mockResolvedValue('42');
		const wrapper = mountPanel();
		await openCreateForm(wrapper);

		wrapper.findComponent(ContactCreateForm).vm.$emit('submit', draft);
		await flushPromises();

		expect(wrapper.findComponent(ContactCard).props('contactId')).toBe('42');
		expect(contactsList.loadDataList).not.toHaveBeenCalled();
	});

	it('keeps the create form open when the contact was not created', async () => {
		creation.createContact.mockResolvedValue(null);
		const wrapper = mountPanel();
		await openCreateForm(wrapper);

		wrapper.findComponent(ContactCreateForm).vm.$emit('submit', draft);
		await flushPromises();

		expect(wrapper.findComponent(ContactCreateForm).exists()).toBe(true);
		expect(useSidebarSelectionStore().contactId).toBeNull();
		expect(contactsList.loadDataList).not.toHaveBeenCalled();
	});

	it('still shows the created contact when the Contacts list fails to reload', async () => {
		creation.createContact.mockResolvedValue('42');
		contactsList.loadDataList.mockRejectedValueOnce(new Error('500'));
		const wrapper = mountPanel();
		await openCreateForm(wrapper);

		wrapper.findComponent(ContactCreateForm).vm.$emit('submit', draft);
		await flushPromises();

		expect(wrapper.findComponent(ContactCard).props('contactId')).toBe('42');
	});

	it('leaves the selection alone when the panel is gone before the save answers', async () => {
		const request = createDeferred<string | null>();
		creation.createContact.mockReturnValue(request.promise);
		const wrapper = mountPanel();
		await openCreateForm(wrapper);

		wrapper.findComponent(ContactCreateForm).vm.$emit('submit', draft);
		wrapper.unmount();
		request.resolve('42');
		await flushPromises();

		expect(useSidebarSelectionStore().selection).toBeNull();
		expect(contactsList.loadDataList).not.toHaveBeenCalled();
	});

	it('keeps the row picked while the save was in flight', async () => {
		const request = createDeferred<string | null>();
		creation.createContact.mockReturnValue(request.promise);
		const wrapper = mountPanel();
		await openCreateForm(wrapper);

		wrapper.findComponent(ContactCreateForm).vm.$emit('submit', draft);
		await selectContact('7');
		request.resolve('42');
		await flushPromises();

		expect(useSidebarSelectionStore().contactId).toBe('7');
	});
});
