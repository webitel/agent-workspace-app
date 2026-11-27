import { mount } from '@vue/test-utils';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

const contact = ref<WebitelContactsContact | null>(null);
const isLoading = ref(false);
const reload = vi.fn();
let loadedId: () => string = () => '';

// the loading itself is covered by useContact's own tests
vi.mock('../composables/useContact', () => ({
	useContact: (contactId: { value: string }) => {
		loadedId = () => contactId.value;
		return {
			contact,
			isLoading,
			reload,
		};
	},
}));

import ContactCard from '../contact-card.vue';
import ContactCardById from '../contact-card-by-id.vue';

const WtLoaderStub = {
	name: 'WtLoader',
	template: '<div class="wt-loader-stub" />',
};

const mountCard = () =>
	mount(ContactCardById, {
		props: {
			contactId: '42',
		},
		global: {
			stubs: {
				WtLoader: WtLoaderStub,
				ContactCard: true,
			},
		},
	});

describe('contact-card-by-id', () => {
	it('loads the contact by its id', () => {
		mountCard();

		expect(loadedId()).toBe('42');
	});

	it('shows the loader while the contact loads, then its card', async () => {
		contact.value = null;
		isLoading.value = true;
		const wrapper = mountCard();

		expect(wrapper.findComponent(WtLoaderStub).exists()).toBe(true);
		expect(wrapper.findComponent(ContactCard).exists()).toBe(false);

		contact.value = {
			id: '42',
		};
		isLoading.value = false;
		await nextTick();

		expect(wrapper.findComponent(WtLoaderStub).exists()).toBe(false);
		expect(wrapper.findComponent(ContactCard).props('contact')).toEqual({
			id: '42',
		});
	});

	it('shows nothing when the contact failed to load', () => {
		contact.value = null;
		isLoading.value = false;
		const wrapper = mountCard();

		expect(wrapper.findComponent(ContactCard).exists()).toBe(false);
	});

	it('reloads the contact in place once the card changed it (WS-171)', () => {
		contact.value = {
			id: '42',
		};
		isLoading.value = false;
		reload.mockClear();
		const wrapper = mountCard();

		wrapper.findComponent(ContactCard).vm.$emit('changed');

		expect(reload).toHaveBeenCalledTimes(1);
	});
});
