import type { ContactIdentity } from '../../../scripts/isSelfContact';

/**
 * A chat's newest message as the chat preview shows it (CONTEXT.md: Last
 * message). Not the SDK message: the preview needs three facts from it and
 * nothing else, and holding the whole class would keep it in a reactive store.
 */
export interface LastMessage {
	id: string;
	body?: string;
	/** Epoch ms. Absent when the message carried no usable timestamp. */
	at?: number;
	/** Who wrote it, compared against the agent's own account. */
	senderContact?: ContactIdentity;
}

export type LastMessageSender = 'client' | 'agent';

/** What a row of the chat list shows for one chat (CONTEXT.md: Chat preview). */
export interface ChatPreview {
	/** The client's messenger username, falling back to their name. */
	name?: string;
	queueName?: string;
	lastMessage?: {
		body?: string;
		/** Epoch ms. */
		at?: number;
		/** Absent while it cannot be told, e.g. before the agent's account loads. */
		sender?: LastMessageSender;
	};
}
