import type {
	ContactsInputLabel,
	WebitelContactsLookup,
} from '@webitel/api-services/gen/models';

export interface NewContactDraft {
	name: string;
	phoneNumber: string;
	email: string;
	timezone: WebitelContactsLookup | null;
	owner: WebitelContactsLookup | null;
	labels: ContactsInputLabel[];
	description: string;
}

export interface DefaultCommunicationTypes {
	phone?: WebitelContactsLookup;
	email?: WebitelContactsLookup;
}
