import type { Task } from 'webitel-sdk';

import { isChatTask } from './isChatTask';

/**
 * Whether a chat task is currently being offered to this agent.
 *
 * Deliberately not `state === JobState.Offering`. The SDK never puts a chat
 * task in that state: the constructor assigns `"offering"` and then immediately
 * overwrites it with the event's own `status`, and a task is only created on
 * `distribute` — so `state` reads `"distribute"`. The later `offering` frame
 * calls `setOffering()`, which records `offeringAt` and nothing else.
 *
 * Nor are the SDK's permission getters usable: `allowAccept`, `allowDecline`
 * and `allowClose` are hardcoded to `channel === 'task'`, so all three are
 * `false` for every `im` task.
 *
 * What is left is the timestamps, which the SDK does maintain:
 *
 * - `offeringAt > 0` — it has actually been offered to this agent, rather than
 *   merely created by a `distribute` frame
 * - `bridgedAt === 0` — nobody has taken it yet (`setBridged` records this and
 *   leaves `state` alone)
 * - `closedAt === 0` — it has not been closed out
 *
 * Missed and closed tasks leave the feed entirely: the agent drops them from
 * its task map, so `allTask()` stops returning them.
 */
export function isIncomingChatOffer(task: Task): boolean {
	if (!task) return false;

	return (
		isChatTask(task) &&
		task.offeringAt > 0 &&
		task.bridgedAt === 0 &&
		task.closedAt === 0
	);
}
