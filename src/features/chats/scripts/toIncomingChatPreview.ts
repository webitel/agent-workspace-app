import type { Task } from 'webitel-sdk';

import {
	type IncomingInteractionPreview,
	InteractionKind,
} from '../../../ui/notifications/types/IncomingInteraction.types';

/**
 * Maps an SDK chat `Task` onto the channel-neutral preview contract, so the
 * notifications module stays free of `webitel-sdk`.
 */

/**
 * `distribute.member_name` — the name pushed from the schema or member. Null
 * when the platform has nothing, which is the "contact not identified" case
 * (AC_06.01.01). Full contact identification is E7's job, not this story's.
 */
function resolveName(task: Task): string | undefined {
	return task.displayName || undefined;
}

export function toIncomingChatPreview(task: Task): IncomingInteractionPreview {
	return {
		kind: InteractionKind.Chat,
		name: resolveName(task),
		// the client's username, from `communication.destination`
		identifier: task.displayNumber || undefined,
		/**
		 * AC_06.01.01 wants the gateway the chat arrived through. Nothing on
		 * `Task` carries one — `channel` is the channel *type* (`im`) and
		 * `Task.queue` is only `{ id, name }` — so the line is omitted rather
		 * than filled with the communication type, which would read as a gateway
		 * name and mislead on any tenant running more than one. Asked for on
		 * WS-35.
		 */
		source: undefined,
		body: task.thread?.lastMsg,
		/**
		 * No trustworthy queue-entry epoch exists: `offeringAt` resets on every
		 * redistribution, and neither `createdAt` nor `bridgedAt` is documented as
		 * the customer's queue entry. The waiting block stays hidden until WS-35
		 * settles it.
		 */
		waitingSince: undefined,
		maxWaitSec: undefined,
	};
}
