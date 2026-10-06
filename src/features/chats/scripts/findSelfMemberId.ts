import type { AccountModel, ThreadModel } from '@webitel/chat-web-sdk';
import { isSelfContact } from './isSelfContact';

/**
 * The operator's member in this thread: the one whose contact is the
 * logged-in IM account (same issuer + subject). '' when not a member yet.
 */
export function findSelfMemberId(
	thread: ThreadModel | null,
	account: AccountModel | null,
): string {
	if (!thread) return '';

	return (
		thread.members?.find((member) => isSelfContact(member.contact, account))
			?.id ?? ''
	);
}
