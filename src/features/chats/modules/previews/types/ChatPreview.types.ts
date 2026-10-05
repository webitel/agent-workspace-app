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
	/** Thread member id of the sender, compared against the agent's own member. */
	senderId?: string;
}
