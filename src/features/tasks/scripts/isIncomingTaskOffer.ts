import type { Task } from 'webitel-sdk';

import { isJobTask } from './isJobTask';

/**
 * Whether a job task is currently being offered to this agent.
 *
 * `allowAccept` already covers "not taken, not closed" for the task channel
 * (`bridgedAt === 0 && closedAt === 0`). `offeringAt` is checked on top
 * because, as with chats, `state` never reads `offering` (ADR-0001): a task
 * created by a `distribute` frame has not been offered to this agent yet.
 */
export function isIncomingTaskOffer(task: Task): boolean {
	if (!task) return false;

	return isJobTask(task) && task.allowAccept && task.offeringAt > 0;
}
