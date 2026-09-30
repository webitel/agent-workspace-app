import type { Task } from 'webitel-sdk';

type ThreadMembers = NonNullable<Task['thread']>['members'];
type ThreadMember = NonNullable<ThreadMembers>[number];

/**
 * The agent's own membership of a thread. Nothing on the member says "self",
 * so it is the one whose contact subject is the logged-in user (ADR-0005).
 * Undefined while the thread's members have not arrived, or when the rule
 * does not hold for a thread — callers must not fall back to a guess.
 */
export function findSelfMember(
	members: ThreadMembers | undefined,
	userId: string | number | undefined,
): ThreadMember | undefined {
	if (userId === undefined || userId === null) return undefined;
	return members?.find(
		(member) => String(member.contact?.sub) === String(userId),
	);
}
