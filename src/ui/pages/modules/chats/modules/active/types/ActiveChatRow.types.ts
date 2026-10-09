/**
 * One row of the Active tab's table: an accepted chat (US_02.06).
 *
 * Source and Username have columns but no fields: nothing on the task carries
 * them yet, and a value approximated from another field would read as fact
 * (ADR-0001).
 */
export interface ActiveChatRow {
	/** The thread id: the row's key and what opens the chat. */
	id: string;
	name?: string;
	queueName?: string;
	/** The Last message's text, kept current by the chats socket. */
	lastMessage?: string;
	/**
	 * Epoch ms the agent accepted the chat: shown as Started at, and Duration
	 * counts from it.
	 */
	bridgedAt?: number;
}
