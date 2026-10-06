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
 * The task's own `thread.lastMsg` is a snapshot, taken when the chat was
 * distributed and never refreshed (the SDK replaces a task's distribution only
 * on transfer), and it is only text. It stands in for the body while no last
 * message is known at all. Once one is, its own body is the truth, even when
 * it has none (an image, a deleted message): the snapshot would be an older
 * message's text under the newer message's time and author.
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

	const body = lastMessage
		? lastMessage.body
		: task.thread?.lastMsg || undefined;
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
