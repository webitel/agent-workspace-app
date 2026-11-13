import { ContactsAPI } from '@webitel/api-services/api';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';

/**
 * The contacts holding a phone number, as cc-workspaces searches them for a
 * call's client. A failed search is thrown to the caller.
 */
export async function findContactIdsByNumber(
	number: string,
): Promise<string[]> {
	// 100 is enough, as in cc-workspaces (WTEL-7906)
	const contacts: WebitelContactsContact[] = (
		await ContactsAPI.getList({
			q: number,
			qin: 'phones',
			size: 100,
		})
	).items;

	return contacts.map(({ id }) => id).filter((id): id is string => Boolean(id));
}
