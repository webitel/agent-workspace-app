import { findClientContact } from '../../../scripts/findClientContact';
import type { ChatHeader } from '../../../scripts/toChatHeader';
import type { ILeftThread } from '../../../types/ChatSession.types';

/**
 * What a closed chat's top bar shows. The name follows the active chat's
 * (messenger username, else name), read off the thread's client. There is no
 * queue: a left thread does not carry one (ADR-0009).
 */
export function toClosedChatHeader(
	thread: ILeftThread,
	userId: string,
): ChatHeader {
	const client = findClientContact(thread.members, userId);

	return {
		name: client?.username || client?.name || undefined,
		queueName: undefined,
	};
}
