import type { AccountModel } from '@webitel/chat-web-sdk';

/** What identifies a contact across messengers: who issued it, and its subject. */
export interface ContactIdentity {
	sub?: string;
	iss?: string;
}

/**
 * Whether a contact is the logged-in IM account: same subject, and the same
 * issuer when the account names one. False while the account is unknown, so
 * "not the agent" is never claimed for a contact that might be.
 */
export function isSelfContact(
	contact: ContactIdentity | null | undefined,
	account: AccountModel | null,
): boolean {
	const self = account?.contact;
	if (!self?.sub || !contact) return false;

	return contact.sub === self.sub && (!self.iss || contact.iss === self.iss);
}
