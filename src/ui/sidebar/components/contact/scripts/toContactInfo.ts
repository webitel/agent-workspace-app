import type {
	ContactsVariable,
	WebitelContactsContact,
} from '@webitel/api-services/gen/models';

import { toVariableRows } from '../../../../../features/variables/scripts/toVariableRows';
import type { VariableRow } from '../../../../../features/variables/types/Variables.types';

export interface ContactInfo {
	timezone: string;
	owner: string;
	groups: string;
	attributes: VariableRow[];
}

/**
 * The contact keeps variables as a `{ key, value }` list; the shared rows
 * mapper takes a map. Entries without a key are dropped, a repeated key keeps
 * its last value.
 */
function toVariablesMap(
	variables: ContactsVariable[] = [],
): Record<string, unknown> {
	return Object.fromEntries(
		variables
			.filter((variable) => variable.key)
			.map(({ key, value }) => [
				key,
				value,
			]),
	);
}

export function toContactInfo(contact: WebitelContactsContact): ContactInfo {
	return {
		timezone: contact.timezones?.data?.[0]?.timezone?.name ?? '',
		owner: contact.managers?.data?.[0]?.user?.name ?? '',
		groups: (contact.groups?.data ?? [])
			.map(({ group }) => group?.name)
			.filter(Boolean)
			.join(', '),
		attributes: toVariableRows(
			toVariablesMap(contact.variables?.data),
			'contact',
		),
	};
}
