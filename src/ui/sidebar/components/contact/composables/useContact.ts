import { ContactsAPI } from '@webitel/api-services/api';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { type Ref, ref, watch } from 'vue';

export const useContact = (contactId: Ref<string>) => {
	const contact = ref<WebitelContactsContact | null>(null);
	const isLoading = ref(false);

	watch(
		contactId,
		async (id, _oldId, onCleanup) => {
			let isStale = false;
			onCleanup(() => {
				isStale = true;
			});

			contact.value = null;
			isLoading.value = true;

			try {
				const loadedContact: WebitelContactsContact = await ContactsAPI.get({
					itemId: id,
				});
				if (!isStale) contact.value = loadedContact;
			} catch {
				// error notification is shown by api-services
			} finally {
				if (!isStale) isLoading.value = false;
			}
		},
		{
			immediate: true,
		},
	);

	return {
		contact,
		isLoading,
	};
};
