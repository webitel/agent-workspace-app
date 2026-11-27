import { ContactsAPI } from '@webitel/api-services/api';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';

import { CONTACT_FIELDS } from '../constants/contactFields';

/**
 * The contacts holding a phone number, as cc-workspaces searches them for a
 * call's client, with every field the contact card shows. A failed search is
 * thrown to the caller.
 */
export async function findContactsByNumber(
	number: string,
): Promise<WebitelContactsContact[]> {
	// 100 is enough, as in cc-workspaces (WTEL-7906)
	const {
		items,
	}: {
		items: WebitelContactsContact[];
	} = await ContactsAPI.getList({
		q: number,
		qin: 'phones',
		size: 100,
		fields: CONTACT_FIELDS,
	});

	return items.filter(({ id }) => Boolean(id));
}
