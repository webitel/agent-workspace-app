import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref, toValue } from 'vue';
import ContactCardUnknown from '../../../components/contact/contact-card-unknown.vue';
import ContactIdentification from '../../../components/contact/contact-identification.vue';
import ContactPanelEmpty from '../../../components/contact/contact-panel-empty.vue';
import SidebarSectionHeader from '../../../components/sidebar-section-header.vue';
import { useSidebarSelectionStore } from '../../../store/sidebar-selection';

const contactIds = ref<string[]>([]);
const isLoading = ref(false);
let searchedNumber: () => string | undefined = () => undefined;

vi.mock(
	'../../../components/contact/composables/useContactIdentificationByNumber',
	() => ({
		useContactIdentificationByNumber: (
			phoneNumber: () => string | undefined,
		) => {
			searchedNumber = () => toValue(phoneNumber);
			return {
				contactIds,
				isLoading,
			};
		},
	}),
);

import TheOfflineMemberPanel from '../the-offline-member-panel.vue';

const mountPanel = () =>
	mount(TheOfflineMemberPanel, {
		global: {
			stubs: {
				ContactCardUnknown: true,
				ContactIdentification: true,
				ContactPanelEmpty: true,
			},
		},
	});

const getTitle = (wrapper: ReturnType<typeof mountPanel>) =>
	wrapper.findComponent(SidebarSectionHeader).props('title');

const selectMember = async (phoneNumber?: string) => {
	useSidebarSelectionStore().selectPhoneNumber(phoneNumber);
	await nextTick();
};

describe('the-offline-member-panel', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		contactIds.value = [];
		isLoading.value = false;
	});

	it('shows the empty state with the Contacts title when nothing is selected', () => {
		const wrapper = mountPanel();

		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(true);
		expect(wrapper.findComponent(ContactIdentification).exists()).toBe(false);
		expect(wrapper.findComponent(ContactCardUnknown).exists()).toBe(false);
		expect(getTitle(wrapper)).toBe('objects.contact');
	});

	it('searches the contact by the selected member number', async () => {
		mountPanel();

		await selectMember('380501112233');

		expect(searchedNumber()).toBe('380501112233');
	});

	it('shows the loader while the contact is searched', async () => {
		const wrapper = mountPanel();
		isLoading.value = true;

		await selectMember('380501112233');

		expect(
			wrapper.findComponent(ContactIdentification).props('isLoading'),
		).toBe(true);
		expect(wrapper.findComponent(ContactCardUnknown).exists()).toBe(false);
	});

	it('shows the found contact with the Profile title', async () => {
		const wrapper = mountPanel();
		contactIds.value = [
			'15',
		];

		await selectMember('380501112233');

		expect(
			wrapper.findComponent(ContactIdentification).props('contactIds'),
		).toEqual([
			'15',
		]);
		expect(getTitle(wrapper)).toBe('ui.sidebar.contact.profile');
	});

	it('leaves several found contacts to the identification, under the Profile title', async () => {
		const wrapper = mountPanel();
		contactIds.value = [
			'15',
			'16',
		];

		await selectMember('380501112233');

		expect(
			wrapper.findComponent(ContactIdentification).props('contactIds'),
		).toEqual([
			'15',
			'16',
		]);
		expect(getTitle(wrapper)).toBe('ui.sidebar.contact.profile');
	});

	it('offers no SELECT: there is no call to link a contact to', async () => {
		const wrapper = mountPanel();
		contactIds.value = [
			'15',
			'16',
		];

		await selectMember('380501112233');

		expect(
			wrapper.findComponent(ContactIdentification).props('canSelect'),
		).toBeFalsy();
	});

	it('shows an unknown contact when none is found', async () => {
		const wrapper = mountPanel();

		await selectMember('380501112233');

		expect(wrapper.findComponent(ContactCardUnknown).exists()).toBe(true);
		expect(wrapper.findComponent(ContactIdentification).exists()).toBe(false);
		expect(getTitle(wrapper)).toBe('objects.contact');
	});

	it('returns to the empty state when the selection is cleared', async () => {
		const wrapper = mountPanel();
		await selectMember('380501112233');

		useSidebarSelectionStore().clearSelection();
		await nextTick();

		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(true);
		expect(searchedNumber()).toBeUndefined();
	});
});
