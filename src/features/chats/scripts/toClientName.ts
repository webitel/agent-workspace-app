/**
 * How a client is named wherever a chat is summarised: their messenger
 * username (AC_03.01.01), falling back to their name.
 */
export function toClientName(
	contact?: {
		username?: string;
		name?: string;
	} | null,
): string | undefined {
	return contact?.username || contact?.name || undefined;
}
