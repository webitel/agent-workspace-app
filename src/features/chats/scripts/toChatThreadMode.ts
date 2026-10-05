import { ChatThreadMode } from '@webitel/ui-chats/v2';
import type { Task } from 'webitel-sdk';

import { isIncomingChatOffer } from './isIncomingChatOffer';

/**
 * What the chat thread lets the operator do: an offer is only previewed, a
 * live chat is writable, and once it is closed or in post-processing the
 * client can no longer receive messages.
 */
export function toChatThreadMode(
	task: Task | undefined,
	isPostProcessing: boolean,
): ChatThreadMode {
	if (task && isIncomingChatOffer(task)) return ChatThreadMode.Awaiting;
	if (!task || task.closedAt > 0 || isPostProcessing) {
		return ChatThreadMode.Readonly;
	}
	return ChatThreadMode.Active;
}
