// Issuers of the contacts that are never the client: our own users (agents)
// and bots. Anyone else came in through a messenger (WS-96).
const NON_CLIENT_ISSUERS = new Set([
	'webitel',
	'bot',
]);

/**
 * The client in a thread: the first member whose contact was issued by
 * neither webitel nor a bot. Every agent who was ever a member — after a
 * transfer there are several — is a webitel contact, so none is mistaken for
 * the client.
 */
export function findClientContact<
	Contact extends {
		isBot?: boolean;
		iss?: string;
	},
>(
	members: {
		contact?: Contact;
	}[] = [],
): Contact | undefined {
	return members.find(
		({ contact }) =>
			contact && !contact.isBot && !NON_CLIENT_ISSUERS.has(contact.iss ?? ''),
	)?.contact;
}
