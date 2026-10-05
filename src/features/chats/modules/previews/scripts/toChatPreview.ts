import type { AccountModel } from '@webitel/chat-web-sdk';
import type { Task } from 'webitel-sdk';
import { findSelfMemberId } from '../../../scripts/findSelfMemberId';
import { toChatHeader } from '../../../scripts/toChatHeader';
import type { ChatPreview, LastMessage } from '../types/ChatPreview.types';

/**
 * Maps an accepted chat's task, and the last message held for it, onto what its
 * row in the chat list shows.
 *
 * The name and the queue are the chat header's, so a chat reads the same in the
 * list as it does once opened (AC_03.01.01).
 *
 * The task's own `thread.lastMsg` is only text, so it stands in for the body
 * until the last message arrives, or when that message has none (an
 * attachment); it can say nothing about time or sender.
 *
 * Who wrote the message is "the agent" or "not the agent": a thread can hold
 * bots and other operators, and the row distinguishes only the agent's own
 * messages. It stays unknown until the agent's member in the thread can be
 * found, so a row never calls the agent's message the client's.
 */
export function toChatPreview(
	task: Task,
	lastMessage: LastMessage | undefined,
	account: AccountModel | null,
): ChatPreview {
	const { name, queueName } = toChatHeader(task);

	const body = lastMessage?.body ?? task.thread?.lastMsg ?? undefined;
	const at = lastMessage?.at;

	const selfMemberId = findSelfMemberId(task.thread, account);
	const sender =
		selfMemberId && lastMessage?.senderId
			? lastMessage.senderId === selfMemberId
				? 'agent'
				: 'client'
			: undefined;

	return {
		name,
		queueName,
		lastMessage:
			body || at !== undefined
				? {
						body: body || undefined,
						at,
						sender,
					}
				: undefined,
	};
}
