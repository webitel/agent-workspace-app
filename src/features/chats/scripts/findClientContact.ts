/**
 * The client in a thread: the first member with a contact that is neither
 * a bot nor the current user.
 *
 * Interim until WS-96 says how to tell the client. Wrong once another agent
 * is (or was) a member of the thread: that agent is not a bot and not the
 * current user, so it is picked as the client.
 */
export function findClientContact<
	Contact extends {
		isBot?: boolean;
		sub?: string;
	},
>(
	members: {
		contact?: Contact;
	}[] = [],
	userId: string,
): Contact | undefined {
	return members.find(
		({ contact }) => contact && !contact.isBot && contact.sub !== userId,
	)?.contact;
}
