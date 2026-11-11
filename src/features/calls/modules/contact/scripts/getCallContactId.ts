import type { Call } from 'webitel-sdk';

function getOwnContactId(call: Call | undefined): string | undefined {
	const id = call?.contact?.id;
	return id ? String(id) : undefined;
}

/**
 * The contact already linked to the call. A transferred call may carry none of
 * its own: then the contact of the call it is bridged to is the one, as in
 * cc-workspaces.
 */
export function getCallContactId(
	call: Call,
	getCallById: (callId: string) => Call | undefined,
): string | undefined {
	return (
		getOwnContactId(call) ??
		(call.bridgedId ? getOwnContactId(getCallById(call.bridgedId)) : undefined)
	);
}
