import { ContactsAPI } from '@webitel/api-services/api';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';

/**
 * Reloads a contact the panel holds after the card changed it (a phone or an
 * email added), and hands the fresh one to `onLoaded` to put in its place.
 * Only the newest reload of a contact is handed on; a failed one is notified
 * by api-services and leaves the contact as it is.
 * [WS-186](https://webitel.atlassian.net/browse/WS-186)
 */
export function createContactReloader(
	onLoaded: (contact: WebitelContactsContact) => void,
) {
	const lastRequestIds = new Map<string, number>();
	let lastRequestId = 0;

	return async (contactId: string) => {
		const requestId = ++lastRequestId;
		lastRequestIds.set(contactId, requestId);

		try {
			const contact: WebitelContactsContact = await ContactsAPI.get({
				itemId: contactId,
			});
			if (lastRequestIds.get(contactId) === requestId) onLoaded(contact);
		} catch {
			// error notification is shown by api-services
		} finally {
			if (lastRequestIds.get(contactId) === requestId)
				lastRequestIds.delete(contactId);
		}
	};
}

/** the contacts with the one of the same id put in its place */
export const replaceContact = (
	contacts: WebitelContactsContact[],
	contact: WebitelContactsContact,
) => contacts.map((shown) => (shown.id === contact.id ? contact : shown));
