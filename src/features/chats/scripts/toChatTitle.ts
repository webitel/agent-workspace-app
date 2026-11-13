import type { Task } from 'webitel-sdk';

import { toClientName } from './toClientName';

export interface ChatTitle {
	/** the client's messenger username (AC_03.01.01); falls back to their name */
	name?: string;
	queueName?: string;
}

/**
 * Maps an SDK chat `Task` onto how the chat is titled: who it is with and the
 * queue it came from. The one place that names a chat: the top bar and the chat
 * preview both take it from here, so a chat reads the same in the list and once
 * opened (AC_02.03.01, AC_03.01.01).
 *
 * The name is the client's, from the thread's members, once the chat list has
 * read them. Until then, and for an offer, it is the task's: the same sources
 * as the incoming offer (`toChatOfferContent`).
 */
export function toChatTitle(
	task: Task,
	client?: {
		username?: string;
		name?: string;
	},
): ChatTitle {
	return {
		name:
			toClientName(client) ||
			task.displayNumber ||
			task.displayName ||
			undefined,
		queueName: task.queue?.name || undefined,
	};
}
