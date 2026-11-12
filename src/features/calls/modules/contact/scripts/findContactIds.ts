import { ContactsAPI } from '@webitel/api-services/api';

/**
 * 100 is enough, as in cc-workspaces (WTEL-7906)
 */
const FOUND_CONTACTS_MAX_COUNT = 100;

export async function findContactIds({
	query,
	searchedFields,
}: {
	query: string;
	searchedFields: string;
}): Promise<string[]> {
	const { items } = await ContactsAPI.getList({
		q: query,
		qin: searchedFields,
		size: FOUND_CONTACTS_MAX_COUNT,
	});

	return items.map(({ id }) => id).filter((id): id is string => Boolean(id));
}
