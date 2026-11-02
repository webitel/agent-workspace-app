import type { Task } from 'webitel-sdk';

/**
 * Whether a task belongs to the job (task) channel.
 *
 * The SDK multiplexes calls, chats and jobs through one task feed, so every
 * job-side consumer has to narrow it first.
 */

export const TASK_CHANNEL = 'task';

export function isJobTask(task: Task): boolean {
	return task?.channel === TASK_CHANNEL;
}
