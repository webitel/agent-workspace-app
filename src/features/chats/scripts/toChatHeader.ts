import type { Task } from 'webitel-sdk';

export interface ChatHeader {
	/** the client's messenger username (AC_03.01.01); falls back to their name */
	name?: string;
	queueName?: string;
}

/**
 * Maps an SDK chat `Task` onto what the top bar shows. Same sources as the
 * incoming offer (`toChatOfferContent`), so a chat reads the same before
 * and after it is accepted.
 */
export function toChatHeader(task: Task): ChatHeader {
	return {
		name: task.displayNumber || task.displayName || undefined,
		queueName: task.queue?.name || undefined,
	};
}
