import type { AccountModel, ThreadModel } from '@webitel/chat-web-sdk';

/**
 * The operator's member in this thread: the one whose contact is the
 * logged-in IM account (same issuer + subject). '' when not a member yet.
 */
export function findSelfMemberId(
	thread: ThreadModel | null,
	account: AccountModel | null,
): string {
	const self = account?.contact;
	if (!thread || !self?.sub) return '';

	return (
		thread.members?.find(
			(member) =>
				member.contact?.sub === self.sub &&
				(!self.iss || member.contact?.iss === self.iss),
		)?.id ?? ''
	);
}
