import { ContactsSearchMode } from '@webitel/api-services/api';

/**
 * @author Oleksandr Palonnyi
 * the modes the panel offers, a subset of the contacts API's ones: the same three the CRM Contacts search has
 * [WS-76](https://webitel.atlassian.net/browse/WS-76)
 */
export const CONTACT_SEARCH_MODES = [
	ContactsSearchMode.NAME,
	ContactsSearchMode.DESTINATION,
	ContactsSearchMode.VARIABLES,
] as const;

export type ContactSearchMode = (typeof CONTACT_SEARCH_MODES)[number];
