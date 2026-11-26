import { ContactsAPI } from '@webitel/api-services/api';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { type Ref, ref, watch } from 'vue';

export const useContact = (contactId: Ref<string>) => {
	const contact = ref<WebitelContactsContact | null>(null);
	const isLoading = ref(false);

	let lastRequestId = 0;

	const loadContact = async (
		id: string,
		{
			silent,
		}: {
			silent: boolean;
		},
	) => {
		const requestId = ++lastRequestId;
		const isStale = () => requestId !== lastRequestId;

		if (!silent) {
			contact.value = null;
			isLoading.value = true;
		}

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

	/**
	 * @author Polina Sukhorukova
	 * Refetches the shown contact in place, after the card changed it: the card
	 * keeps what it shows, with no loader, until the fresh one arrives
	 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
	 */
	const reload = () =>
		loadContact(contactId.value, {
			silent: true,
		});

	watch(
		contactId,
		(id) =>
			loadContact(id, {
				silent: false,
			}),
		{
			immediate: true,
		},
	);

	return {
		contact,
		isLoading,
		reload,
	};
};
