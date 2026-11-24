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

export interface CommunicationTypeOption {
	id: string;
	name: string;
}

export interface CommunicationDraft {
	value: string;
	type: CommunicationTypeOption | null;
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

const toRecord = (
	tab: AddableCommunicationTab,
	{ value, type }: CommunicationDraft,
	{
		primary,
	}: {
		primary: boolean;
	},
) => ({
	[ADDABLE_TABS[tab].field]: value.trim(),
	type: type
		? {
				id: type.id,
				name: type.name,
			}
		: undefined,
	primary,
});

/**
 * @author Polina Sukhorukova
 * Whether the draft passes the rules CRM applies to a new phone / email
 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
 */
export const isValidCommunicationDraft = (
	tab: AddableCommunicationTab,
	draft: CommunicationDraft,
): boolean =>
	ADDABLE_TABS[tab].schema.safeParse(
		toRecord(tab, draft, {
			primary: false,
		}),
	).success;

/**
 * @author Polina Sukhorukova
 * Whether the typed value itself breaks a rule, an empty one does not
 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
 */
export const isInvalidCommunicationValue = (
	tab: AddableCommunicationTab,
	value: string,
): boolean => {
	const { schema, field } = ADDABLE_TABS[tab];
	const trimmed = value.trim();
	return !!trimmed && !schema.shape[field].safeParse(trimmed).success;
};

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
	draft: CommunicationDraft,
	{
		primary,
	}: {
		primary: boolean;
	},
) =>
	ADDABLE_TABS[tab].add({
		parentId: contactId,
		itemInstance: toRecord(tab, draft, {
			primary,
		}),
	});
