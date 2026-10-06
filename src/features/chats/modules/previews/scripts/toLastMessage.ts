import type { IMessage } from '../../../types/ChatSession.types';
import type { LastMessage } from '../types/ChatPreview.types';

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
export function toLastMessage(message: IMessage): LastMessage | undefined {
	if (message.system) return undefined;

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
