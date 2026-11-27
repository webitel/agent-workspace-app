/**
 * The fields of a contact the right panel's contact card shows, with `id` to
 * link it. A search asks for them, so a found contact is shown from the
 * search's answer, with no request of its own, as in cc-workspaces
 * (`ContactsAPI.getList` adds `mode` itself).
 * [WS-186](https://webitel.atlassian.net/browse/WS-186)
 */
export const CONTACT_FIELDS = [
	'id',
	'name',
	'labels',
	'groups',
	'managers',
	'timezones',
	'variables',
	'phones',
	'emails',
	'imclients',
];
