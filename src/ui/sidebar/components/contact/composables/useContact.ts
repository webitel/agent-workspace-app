import { ContactsAPI } from '@webitel/api-services/api';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { type Ref, ref, watch } from 'vue';

export const useContact = (contactId: Ref<string>) => {
	const contact = ref<WebitelContactsContact | null>(null);
	const isLoading = ref(false);

	let lastRequestId = 0;

	const loadContact = async (id: string) => {
		const requestId = ++lastRequestId;
		const isStale = () => requestId !== lastRequestId;

		contact.value = null;
		isLoading.value = true;

		try {
			const loadedContact: WebitelContactsContact = await ContactsAPI.get({
				itemId: id,
			});
			if (!isStale()) contact.value = loadedContact;
		} catch {
			// error notification is shown by api-services
		} finally {
			if (!isStale()) isLoading.value = false;
		}
	};

	watch(contactId, loadContact, {
		immediate: true,
	});

	return {
		contact,
		isLoading,
	};
};
