import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import ContactCard from '../../../components/contact/contact-card.vue';
import ContactCardUnknown from '../../../components/contact/contact-card-unknown.vue';
import ContactPanelEmpty from '../../../components/contact/contact-panel-empty.vue';
import SidebarSectionHeader from '../../../components/sidebar-section-header.vue';
import { useSidebarSelectionStore } from '../../../store/sidebar-selection';
import TheHistoryPanel from '../the-history-panel.vue';

const mountPanel = () =>
	mount(TheHistoryPanel, {
		global: {
			stubs: {
				ContactCard: true,
				ContactCardUnknown: true,
				ContactPanelEmpty: true,
			},
		},
	});

const getTitle = (wrapper: ReturnType<typeof mountPanel>) =>
	wrapper.findComponent(SidebarSectionHeader).props('title');

describe('the-history-panel', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
	});

	it('shows the empty state with the Contacts title when nothing is selected', () => {
		const wrapper = mountPanel();

		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(true);
		expect(wrapper.findComponent(ContactCard).exists()).toBe(false);
		expect(wrapper.findComponent(ContactCardUnknown).exists()).toBe(false);
		expect(getTitle(wrapper)).toBe('objects.contact');
	});

	it('shows the contact card with the Profile title when a contact is selected', async () => {
		const wrapper = mountPanel();

		useSidebarSelectionStore().selectContact('1');
		await nextTick();

		expect(wrapper.findComponent(ContactCard).props('contactId')).toBe('1');
		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(false);
		expect(wrapper.findComponent(ContactCardUnknown).exists()).toBe(false);
		expect(getTitle(wrapper)).toBe('ui.sidebar.contact.profile');
	});

	it('shows the unknown contact with the Contacts title when an unknown contact is selected', async () => {
		const wrapper = mountPanel();

		useSidebarSelectionStore().selectUnknownContact();
		await nextTick();

		expect(wrapper.findComponent(ContactCardUnknown).exists()).toBe(true);
		expect(wrapper.findComponent(ContactCard).exists()).toBe(false);
		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(false);
		expect(getTitle(wrapper)).toBe('objects.contact');
	});

	it('returns to the empty state when the selection is cleared', async () => {
		const wrapper = mountPanel();
		const store = useSidebarSelectionStore();

		store.selectContact('1');
		await nextTick();
		store.clearSelection();
		await nextTick();

		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(true);
		expect(wrapper.findComponent(ContactCard).exists()).toBe(false);
		expect(getTitle(wrapper)).toBe('objects.contact');
	});
});
