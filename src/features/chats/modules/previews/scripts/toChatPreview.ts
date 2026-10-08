import type { AccountModel } from '@webitel/chat-web-sdk';
import type { Task } from 'webitel-sdk';
import { isSelfContact } from '../../../scripts/isSelfContact';
import { toChatHeader } from '../../../scripts/toChatHeader';
import type { ChatPreview, LastMessage } from '../types/ChatPreview.types';

/**
 * Maps an accepted chat's task, and the last message held for it, onto what its
 * row in the chat list shows.
 *
 * The name and the queue are the chat header's, so a chat reads the same in the
 * list as it does once opened (AC_03.01.01).
 *
 * Everything about the last message comes from `lastMessage`, which the chats
 * socket keeps current. The task's own `thread` is a snapshot, taken when the
 * chat was distributed and never refreshed (the SDK replaces a task's
 * distribution only on transfer), so it serves only to identify the thread the
 * socket's events belong to: its text and its members are not read here, and a
 * row shows no message until the first read answers.
 *
 * Who wrote the message is "the agent" or "not the agent": a thread can hold
 * bots and other operators, and the row distinguishes only the agent's own
 * messages. The message names its sender, so this does not depend on the
 * thread's member list, which at distribution time may not yet include the
 * agent. It stays unknown until the agent's account loads, so a row never calls
 * the agent's message the client's.
 */
export function toChatPreview(
	task: Task,
	lastMessage: LastMessage | undefined,
	account: AccountModel | null,
): ChatPreview {
	const { name, queueName } = toChatHeader(task);

	const body = lastMessage?.body;
	const at = lastMessage?.at;

	const sender =
		account?.contact?.sub && lastMessage?.senderContact
			? isSelfContact(lastMessage.senderContact, account)
				? 'agent'
				: 'client'
			: undefined;

	return {
		name,
		queueName,
		lastMessage:
			body || at !== undefined
				? {
						body,
						at,
						sender,
					}
				: undefined,
	};
}
