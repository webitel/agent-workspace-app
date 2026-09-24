import type { Task } from 'webitel-sdk';

/**
 * Whether a task belongs to the chat channel.
 *
 * The SDK multiplexes calls, chats and jobs through one task feed, so every
 * chat-side consumer has to narrow it first — the offer predicate is only one
 * of them.
 */

export const IM_CHANNEL = 'im';

export function isChatTask(task: Task): boolean {
	return task?.channel === IM_CHANNEL;
}
