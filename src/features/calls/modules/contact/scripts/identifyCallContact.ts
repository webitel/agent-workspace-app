import type { Call } from 'webitel-sdk';

import { findContactIds } from './findContactIds';
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

	const contactIds = await findContactIds({
		query: number,
		searchedFields: 'phones',
	});

	if (contactIds.length !== 1) return contactIds;

	try {
		await call.setContact(Number(contactIds[0]));
		return contactIds;
	} catch (err) {
		console.warn('[calls] linking the found contact failed', err);
		return [];
	}
}
