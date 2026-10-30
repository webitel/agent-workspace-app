import { findClientContact } from '../../../scripts/findClientContact';
import type { ChatHeader } from '../../../scripts/toChatHeader';
import type { ILeftThread } from '../../../types/ChatSession.types';

/**
 * What a closed chat's top bar shows. The name follows the active chat's
 * (messenger username, else name), read off the thread's client; the queue is
 * the one the agent received the thread through, when the backend knows it.
 */
export function toClosedChatHeader(thread: ILeftThread): ChatHeader {
	const client = findClientContact(thread.members);

	return {
		name: client?.username || client?.name || undefined,
		queueName: thread.queue?.name || undefined,
	};
}
