import type { MaybeRefOrGetter } from 'vue';

/**
 * Channel-neutral contract between the domain stores (calls, chats) and this
 * module. Producers map their SDK objects onto it; nothing here knows about
 * `webitel-sdk` or `@webitel/chat-web-sdk`, which is what keeps the preview
 * component shared between WS-32 (call offer) and WS-19 (chat offer).
 */

export const OfferKind = {
	Call: 'call',
	Chat: 'chat',
} as const;

export type OfferKind = (typeof OfferKind)[keyof typeof OfferKind];

/** A secondary line rendered as `${label}: ${value}` — `Queue:` / `Channel:`. */
export interface OfferSource {
	label: string;
	value: string;
}

export interface OfferPreview {
	kind: OfferKind;
	/** Contact/member/schema name. Undefined renders as "Unknown contact" + N/A avatar. */
	name?: string;
	/**
	 * How many *further* contacts matched, beyond the one named above. Contact
	 * identification can return none, one or several, and the design shows the
	 * remainder as a `+N` chip next to the name.
	 *
	 * Optional because nothing on the wire carries the count yet — asked for on
	 * WS-16. Absent renders no chip, which reads the same as "exactly one match".
	 */
	additionalContacts?: number;
	/** Masked phone number (calls) or username (chats). */
	identifier?: string;
	/** Queue name (calls) or gateway name (chats). */
	source?: OfferSource;
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

export interface Offer {
	/** Call id / chat task id. Also the OS notification tag. */
	id: string;
	/**
	 * Kept as a ref, never a snapshot: the preview tracks the live SDK entity so
	 * the card updates in place. Callers must not spread it.
	 */
	preview: MaybeRefOrGetter<OfferPreview>;
	onAccept: () => void;
	onDecline: () => void;
	/** Chats open the conversation when the card body is clicked (AC_06.01.04). */
	onBodyClick?: () => void;
}
