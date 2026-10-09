import type { Task } from 'webitel-sdk';

import type { LastMessage } from '../../../../../../../features/chats/modules/previews/types/ChatPreview.types';
import { toChatHeader } from '../../../../../../../features/chats/scripts/toChatHeader';
import type { ActiveChatRow } from '../types/ActiveChatRow.types';

/**
 * A thread member as the socket sends it in the task's thread preview: flat,
 * `{ id, sub, name, iss, type, role }`. webitel-sdk types `members` as the REST
 * thread member (`{ id, contact, role }`), which the preview does not match, so
 * only the fields read here are listed.
 */
interface ThreadPreviewMember {
	/** The member's id in their source; the client's equals `displayNumber`. */
	sub?: string | number;
	name?: string;
}

/**
 * The client's own name in the thread, as their source (messenger, widget)
 * reports it. Not the CRM contact's name: the task does not carry the contact.
 */
function findClientName(task: Task): string | undefined {
	const members = (task.thread?.members ??
		[]) as unknown as ThreadPreviewMember[];
	const client = members.find(
		(member) => String(member.sub) === task.displayNumber,
	);
	return client?.name || undefined;
}

/**
 * Maps an accepted chat's task, and the last message held for it, onto its row
 * in the Active table.
 *
 * The name follows AC_02.06.02 as far as the task allows: the contact's name
 * comes first there, but the task has no contact, so the client's own name in
 * the thread leads, then the chat header's (the client's address in the
 * channel). The queue is the chat header's.
 *
 * The message comes from `lastMessage` only: the task's own `thread` is a
 * snapshot from distribution and is never refreshed (CONTEXT.md: Last message).
 *
 * `bridgedAt` is the one accept time that survives a page reload; `createdAt`
 * and `duration` restart with the task object. The SDK keeps it at 0 until the
 * chat is taken, which is "not known" here, not the epoch.
 *
 * A task without a thread has nothing to open, so it gets no row.
 */
export function toActiveChatRow(
	task: Task,
	lastMessage: LastMessage | undefined,
): ActiveChatRow | undefined {
	const id = task.thread?.id;
	if (!id) return undefined;

	const header = toChatHeader(task);

	return {
		id,
		name: findClientName(task) || header.name,
		queueName: header.queueName,
		lastMessage: lastMessage?.body,
		bridgedAt: task.bridgedAt || undefined,
	};
}
