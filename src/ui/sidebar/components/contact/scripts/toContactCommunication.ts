import type {
	ContactsIMClient,
	WebitelContactsContact,
} from '@webitel/api-services/gen/models';
import { ProviderIconType } from '@webitel/ui-sdk/enums';

export interface ContactCommunicationItem {
	id: string;
	value: string;
	/** wt-icon name; absent when the gateway has no icon in ui-sdk */
	icon?: string;
}

export interface ContactCommunication {
	phones: ContactCommunicationItem[];
	messaging: ContactCommunicationItem[];
	emails: ContactCommunicationItem[];
}

const PHONE_ICON = 'call--filled';
const EMAIL_ICON = 'ws-navigation-email';

function toGatewayIcon(protocol?: string): string | undefined {
	if (!protocol || !Object.hasOwn(ProviderIconType, protocol)) return undefined;
	return ProviderIconType[protocol as keyof typeof ProviderIconType];
}

/**
 * A messenger record has either a legacy chat client (`user`) or an IM-stack
 * contact (`imContactId`), never both; the latter comes without a name, so it
 * shows as the gateway icon alone. Every record is kept, even one with neither
 * a name nor a known gateway.
 */
function toMessagingItem({
	id,
	user,
	protocol,
}: ContactsIMClient): ContactCommunicationItem {
	return {
		id: id ?? '',
		value: user?.name ?? '',
		icon: toGatewayIcon(protocol),
	};
}

/**
 * Maps a contact onto the Phones / Messaging / Emails tabs of the card's
 * Communication section, keeping the order the API returns.
 */
export function toContactCommunication(
	contact: WebitelContactsContact,
): ContactCommunication {
	return {
		phones: (contact.phones?.data ?? [])
			.filter(({ number }) => number)
			.map(({ id, number }) => ({
				id: id ?? '',
				value: number ?? '',
				icon: PHONE_ICON,
			})),
		messaging: (contact.imclients?.data ?? []).map(toMessagingItem),
		emails: (contact.emails?.data ?? [])
			.filter(({ email }) => email)
			.map(({ id, email }) => ({
				id: id ?? '',
				value: email ?? '',
				icon: EMAIL_ICON,
			})),
	};
}
