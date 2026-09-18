import type { MaybeRefOrGetter } from 'vue';

/**
 * Channel-neutral contract between the domain stores (calls, chats) and this
 * module. Producers map their SDK objects onto it; nothing here knows about
 * `webitel-sdk` or `@webitel/chat-web-sdk`, which is what keeps the preview
 * component shared between WS-32 (call offer) and WS-19 (chat offer).
 */

export const InteractionKind = {
	Call: 'call',
	Chat: 'chat',
} as const;

export type InteractionKind =
	(typeof InteractionKind)[keyof typeof InteractionKind];

/** A secondary line rendered as `${label}: ${value}` — `Queue:` / `Channel:`. */
export interface InteractionSource {
	label: string;
	value: string;
}

export interface IncomingInteractionPreview {
	kind: InteractionKind;
	/** Contact/member/schema name. Undefined renders as "Unknown contact" + N/A avatar. */
	name?: string;
	/** Masked phone number (calls) or username (chats). */
	identifier?: string;
	/** Queue name (calls) or gateway name (chats). */
	source?: InteractionSource;
	/** Last customer message — chats only. */
	body?: string;
	/**
	 * Epoch ms the customer started waiting; the timer ticks from this. Optional
	 * because not every channel can supply one: chat tasks expose no queue-entry
	 * timestamp we trust yet (WS-35), and a wrong number is worse than none —
	 * the whole waiting block is hidden instead.
	 */
	waitingSince?: number;
	/**
	 * Queue "Max wait time" in seconds, the progress bar denominator. Undefined
	 * until the backend exposes it (WS-16 / WS-35) — the bar hides, the counter
	 * still runs.
	 */
	maxWaitSec?: number;
}

export interface IncomingInteraction {
	/** Call id / chat task id. Also the OS notification tag. */
	id: string;
	/**
	 * Kept as a ref, never a snapshot: the preview tracks the live SDK entity so
	 * the card updates in place. Callers must not spread it.
	 */
	preview: MaybeRefOrGetter<IncomingInteractionPreview>;
	onAccept: () => void;
	onDecline: () => void;
	/** Chats open the conversation when the card body is clicked (AC_06.01.04). */
	onBodyClick?: () => void;
}
