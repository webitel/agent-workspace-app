import type { AccountModel, ThreadModel } from '@webitel/chat-web-sdk';
import { type ContactIdentity, isSelfContact } from './isSelfContact';

// Issuer of the contacts that are our own users; their subject is the
// Webitel user id.
const WEBITEL_ISSUER = 'webitel';

function isWebitelUser(
	contact: ContactIdentity | undefined,
	webitelUserId?: string | number | null,
): boolean {
	if (webitelUserId == null || webitelUserId === '') return false;

	return (
		contact?.iss === WEBITEL_ISSUER && contact.sub === String(webitelUserId)
	);
}

/**
 * The operator's member in this thread: the one whose contact is the
 * logged-in IM account (same issuer + subject). '' when not a member yet.
 *
 * While the account is unknown (it failed to load) the member is found by the
 * Webitel user id instead, which is the subject of a webitel contact, so an
 * internal chat still tells the operator's messages from their colleague's.
 */
export function findSelfMemberId({
	thread,
	account,
	webitelUserId,
}: {
	thread: ThreadModel | null;
	account: AccountModel | null;
	webitelUserId?: string | number | null;
}): string {
	if (!thread) return '';

	const isSelf = (contact: ContactIdentity | undefined) =>
		account?.contact?.sub
			? isSelfContact(contact, account)
			: isWebitelUser(contact, webitelUserId);

	return thread.members?.find((member) => isSelf(member.contact))?.id ?? '';
}
