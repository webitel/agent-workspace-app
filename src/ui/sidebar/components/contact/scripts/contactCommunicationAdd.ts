import {
	CommunicationsAPI,
	EmailsAPI,
	PhonesAPI,
} from '@webitel/api-services/api';
import { EngineCommunicationChannels } from '@webitel/api-services/gen/models';
import {
	contactEmailSchema,
	contactPhoneSchema,
} from '@webitel/api-services/validations';
import type { ContactCommunication } from './toContactCommunication';

/**
 * @author Polina Sukhorukova
 * The Communication tabs a record can be added on (AC_07.07.08, 07.07.09)
 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
 */
export type AddableCommunicationTab = Exclude<
	keyof ContactCommunication,
	'messaging'
>;

/** a new phone or email as its tab's schema has it, before it is saved */
export interface NewCommunication {
	number?: string;
	email?: string;
	type?: {
		id?: string | number;
		name?: string;
	};
}

/**
 * @author Polina Sukhorukova
 * Per tab: the record's value field, the channel its Communication types belong
 * to, the rules CRM checks a new record against, and the endpoint that adds it
 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
 */
const ADDABLE_TABS = {
	phones: {
		field: 'number',
		channel: EngineCommunicationChannels.Phone,
		schema: contactPhoneSchema,
		add: PhonesAPI.add,
	},
	emails: {
		field: 'email',
		channel: EngineCommunicationChannels.Email,
		schema: contactEmailSchema,
		add: EmailsAPI.add,
	},
} as const;

export const isAddableCommunicationTab = (
	tab: keyof ContactCommunication,
): tab is AddableCommunicationTab => Object.hasOwn(ADDABLE_TABS, tab);

export const communicationValueField = (tab: AddableCommunicationTab) =>
	ADDABLE_TABS[tab].field;

export const communicationSchema = (tab: AddableCommunicationTab) =>
	ADDABLE_TABS[tab].schema;

export const loadCommunicationTypes = (
	tab: AddableCommunicationTab,
	params: Record<string, unknown>,
) =>
	CommunicationsAPI.getLookup({
		...params,
		channel: ADDABLE_TABS[tab].channel,
	});

/**
 * @author Polina Sukhorukova
 * Adds the record to the contact: the first one on its tab becomes primary, as
 * in CRM; a failure is notified by api-services and rethrown
 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
 */
export const addCommunication = (
	tab: AddableCommunicationTab,
	contactId: string,
	record: NewCommunication,
	{
		primary,
	}: {
		primary: boolean;
	},
) =>
	ADDABLE_TABS[tab].add({
		parentId: contactId,
		itemInstance: {
			...record,
			primary,
		},
	});
