import { convertDuration } from '@webitel/ui-sdk/scripts';

/**
 * How long the agent has had the chat, as `HH:MM:SS`: the fixed width every
 * live timer in the product keeps, so the column does not jump past an hour.
 *
 * Counted from `bridgedAt`, the one accept time that survives a page reload.
 * Without it the cell stays empty rather than showing a zero that reads as fact.
 * A clock running behind the server's is held at zero, never negative.
 */
export function formatChatDuration(
	bridgedAt: number | undefined,
	now: number,
): string {
	if (bridgedAt === undefined) return '';

	const seconds = Math.max(0, Math.floor((now - bridgedAt) / 1000));
	return convertDuration(seconds);
}
