import { ContactsAPI } from '@webitel/api-services/api';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import type { Call } from 'webitel-sdk';

import { getCallContactId } from './getCallContactId';

/**
 * Contact identification of a call, as in cc-workspaces: the contact already
 * linked to the call, otherwise contacts found by the client's number.
 * The only match is linked to the call; several are left for the agent to
 * choose from. A failed search is thrown to the caller.
 */
export async function identifyCallContact(
	call: Call,
	getCallById: (callId: string) => Call | undefined,
): Promise<string[]> {
	const linkedContactId = getCallContactId(call, getCallById);
	if (linkedContactId)
		return [
			linkedContactId,
		];

	const number = call.displayNumber;
	if (!number || call.hideNumber) return [];

	// 100 is enough, as in cc-workspaces (WTEL-7906)
	const contacts: WebitelContactsContact[] = (
		await ContactsAPI.getList({
			q: number,
			qin: 'phones',
			size: 100,
		})
	).items;
	const contactIds = contacts
		.map(({ id }) => id)
		.filter((id): id is string => Boolean(id));

	if (contactIds.length !== 1) return contactIds;

	try {
		await call.setContact(Number(contactIds[0]));
		return contactIds;
	} catch (err) {
		console.warn('[calls] linking the found contact failed', err);
		return [];
	}
}
