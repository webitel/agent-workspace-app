import type { Task } from 'webitel-sdk';

/**
 * Whether a chat's task matches what the agent typed in the list's search:
 * a case-insensitive part of the client's name or username (AC_02.01.03).
 *
 * Both are looked at because the row shows the username and falls back to the
 * name, so the agent can type either. An empty search matches everything.
 */
export function matchesChatSearch(task: Task, query: string): boolean {
	const wanted = query.trim().toLowerCase();
	if (!wanted) return true;

	return [
		task.displayNumber,
		task.displayName,
	].some((name) => name?.toLowerCase().includes(wanted));
}
