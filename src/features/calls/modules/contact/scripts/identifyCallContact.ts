import { ContactsAPI } from '@webitel/api-services/api';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import type { Call } from 'webitel-sdk';

import { findContactsByNumber } from './findContactsByNumber';
import { getCallContactId } from './getCallContactId';

/**
 * Contact identification of a call, as in cc-workspaces: the contact already
 * linked to the call, loaded by its id, otherwise contacts found by the
 * client's number. The only match is linked to the call; several are left for
 * the agent to choose from. A failed request is thrown to the caller.
 */
export async function identifyCallContact(
	call: Call,
	getCallById: (callId: string) => Call | undefined,
): Promise<WebitelContactsContact[]> {
	const linkedContactId = getCallContactId(call, getCallById);
	if (linkedContactId) {
		const linkedContact: WebitelContactsContact = await ContactsAPI.get({
			itemId: linkedContactId,
		});
		return [
			linkedContact,
		];
	}

	const number = call.displayNumber;
	if (!number || call.hideNumber) return [];

	const contacts = await findContactsByNumber(number);

	if (contacts.length !== 1) return contacts;

	try {
		await call.setContact(Number(contacts[0].id));
		return contacts;
	} catch (err) {
		console.warn('[calls] linking the found contact failed', err);
		return [];
	}
}
