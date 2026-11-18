import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref, toValue } from 'vue';
import ContactCard from '../../../components/contact/contact-card.vue';
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

import TheMissedCallPanel from '../the-missed-call-panel.vue';

const mountPanel = () =>
	mount(TheMissedCallPanel, {
		global: {
			stubs: {
				ContactCard: true,
				ContactCardUnknown: true,
				ContactIdentification: true,
				ContactPanelEmpty: true,
			},
		},
	});

const getTitle = (wrapper: ReturnType<typeof mountPanel>) =>
	wrapper.findComponent(SidebarSectionHeader).props('title');

const selectNumber = async (phoneNumber?: string) => {
	useSidebarSelectionStore().selectPhoneNumber(phoneNumber);
	await nextTick();
};

describe('the-missed-call-panel', () => {
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
		expect(wrapper.findComponent(ContactCard).exists()).toBe(false);
		expect(wrapper.findComponent(ContactIdentification).exists()).toBe(false);
		expect(wrapper.findComponent(ContactCardUnknown).exists()).toBe(false);
		expect(getTitle(wrapper)).toBe('objects.contact');
	});

	describe('a call with a linked contact', () => {
		it('shows the linked contact with the Profile title', async () => {
			const wrapper = mountPanel();

			useSidebarSelectionStore().selectContact('7');
			await nextTick();

			expect(wrapper.findComponent(ContactCard).props('contactId')).toBe('7');
			expect(wrapper.findComponent(ContactIdentification).exists()).toBe(false);
			expect(getTitle(wrapper)).toBe('ui.sidebar.contact.profile');
		});

		it('searches nothing', async () => {
			mountPanel();

			useSidebarSelectionStore().selectContact('7');
			await nextTick();

			expect(searchedNumber()).toBeUndefined();
		});
	});

	describe('a call without a linked contact', () => {
		it('searches the contact by the selected number', async () => {
			mountPanel();

			await selectNumber('380501112233');

			expect(searchedNumber()).toBe('380501112233');
		});

		it('shows the loader while the contact is searched', async () => {
			const wrapper = mountPanel();
			isLoading.value = true;

			await selectNumber('380501112233');

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

			await selectNumber('380501112233');

			expect(
				wrapper.findComponent(ContactIdentification).props('contactIds'),
			).toEqual([
				'15',
			]);
			expect(getTitle(wrapper)).toBe('ui.sidebar.contact.profile');
		});

		it('leaves several found contacts to the identification, under the Contacts title', async () => {
			const wrapper = mountPanel();
			contactIds.value = [
				'15',
				'16',
			];

			await selectNumber('380501112233');

			expect(
				wrapper.findComponent(ContactIdentification).props('contactIds'),
			).toEqual([
				'15',
				'16',
			]);
			expect(getTitle(wrapper)).toBe('objects.contact');
		});

		it('shows an unknown contact when none is found', async () => {
			const wrapper = mountPanel();

			await selectNumber('380501112233');

			expect(wrapper.findComponent(ContactCardUnknown).exists()).toBe(true);
			expect(wrapper.findComponent(ContactIdentification).exists()).toBe(false);
			expect(getTitle(wrapper)).toBe('objects.contact');
		});

		it('shows an unknown contact for a hidden number', async () => {
			const wrapper = mountPanel();

			await selectNumber(undefined);

			expect(searchedNumber()).toBeUndefined();
			expect(wrapper.findComponent(ContactCardUnknown).exists()).toBe(true);
		});
	});

	it('returns to the empty state when the selection is cleared', async () => {
		const wrapper = mountPanel();
		await selectNumber('380501112233');

		useSidebarSelectionStore().clearSelection();
		await nextTick();

		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(true);
		expect(searchedNumber()).toBeUndefined();
	});
});
