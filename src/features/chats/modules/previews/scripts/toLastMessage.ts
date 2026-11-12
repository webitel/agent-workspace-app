import type { ContactIdentity } from '../../../scripts/isSelfContact';
import type { LastMessage } from '../types/ChatPreview.types';

/**
 * What a message has to carry to become the last message: the socket's
 * `IMessage` and a thread's `lastMsg` from the thread list both fit.
 */
interface LastMessageSource {
	id?: string;
	body?: string;
	createdAt?: unknown;
	system?: unknown;
	sender?: {
		contact?: ContactIdentity | null;
	} | null;
}

/**
 * Maps an SDK message onto the preview's last message, or `undefined` when it
 * is not part of the conversation.
 *
 * System notices (a member joined, the chat was transferred) carry no text and
 * no one wrote them, so letting one become the last message would blank the
 * row's text and flip its sender colour on housekeeping.
 *
 * A deleted message arrives with its content cleared, so it keeps its place as
 * the newest message but has no body.
 */
export function toLastMessage(
	message: LastMessageSource,
): LastMessage | undefined {
	// a message with no id cannot be told from the next one
	if (message.system || !message.id) return undefined;

	const at = Number(message.createdAt);
	const sender = message.sender?.contact;

	return {
		id: message.id,
		body: message.body || undefined,
		at: Number.isFinite(at) && at > 0 ? at : undefined,
		senderContact: sender?.sub
			? {
					sub: sender.sub,
					iss: sender.iss,
				}
			: undefined,
	};
}
