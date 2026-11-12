import { ContactSearchMode } from '../enums/ContactSearchMode.enum';
import { findContactIds } from './findContactIds';

/**
 * @author Oleksandr Palonnyi
 * the contacts API's qin of each mode, the fields the CRM Contacts search uses; an Attribute search expects key=value as the query
 * [WS-76](https://webitel.atlassian.net/browse/WS-76)
 */
const searchedFieldsByMode: Record<ContactSearchMode, string> = {
	[ContactSearchMode.Name]: 'name',
	[ContactSearchMode.Destination]: 'emails,phones,imclients{user{name}}',
	[ContactSearchMode.Attribute]: 'variables',
};

export function searchContactIds({
	query,
	mode,
}: {
	query: string;
	mode: ContactSearchMode;
}): Promise<string[]> {
	return findContactIds({
		query,
		searchedFields: searchedFieldsByMode[mode],
	});
}
