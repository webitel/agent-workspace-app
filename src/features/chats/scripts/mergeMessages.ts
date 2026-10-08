import type { IMessage } from '../types/ChatSession.types';

const sentAt = (message: IMessage) => Number(message.createdAt);

/**
 * Lays `incoming` over `base`: a message both hold is taken from `incoming`
 * (the later copy — an edit, or the live version of a history entry), and one
 * only `incoming` holds is added.
 *
 * The result is ordered by when each message was sent, oldest first, so a
 * message read from history after a newer one arrived live still lands in its
 * place. The sort is stable and a message without a usable time compares
 * equal, so such messages keep the order they were given in.
 */
export function mergeMessages(
	base: IMessage[],
	incoming: IMessage[],
): IMessage[] {
	const incomingById = new Map(
		incoming.map((message) => [
			message.id,
			message,
		]),
	);
	const baseIds = new Set(base.map((message) => message.id));

	return [
		...base.map((message) => incomingById.get(message.id) ?? message),
		...incoming.filter((message) => !baseIds.has(message.id)),
	].sort((older, newer) => sentAt(older) - sentAt(newer) || 0);
}
