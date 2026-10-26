import { findClientContact } from '../../../scripts/findClientContact';
import type { ChatHeader } from '../../../scripts/toChatHeader';
import type { ILeftThread } from '../../../types/ChatSession.types';

/**
 * What a closed chat's top bar shows. The name follows the active chat's
 * (messenger username, else name), read off the thread's client. There is no
 * queue: a left thread does not carry one (ADR-0010).
 */
export function toClosedChatHeader(thread: ILeftThread): ChatHeader {
	const client = findClientContact(thread.members);

	return {
		name: client?.username || client?.name || undefined,
		queueName: undefined,
	};
}
