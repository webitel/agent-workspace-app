import {
	ContactsAPI,
	type ContactsSearchMode,
} from '@webitel/api-services/api';
import {
	EngineSystemSettingName,
	type WebitelContactsContact,
} from '@webitel/api-services/gen/models';
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue';
import type { Call } from 'webitel-sdk';

import { useSystemSettingsStore } from '../../../../system-settings/store/systemSettings';
import { useCallsStore } from '../../../store/calls';
import { CONTACT_FIELDS } from '../constants/contactFields';
import { getCallContactId } from '../scripts/getCallContactId';
import { identifyCallContact } from '../scripts/identifyCallContact';

type SearchMode = (typeof ContactsSearchMode)[keyof typeof ContactsSearchMode];

/**
 * @author Oleksandr Palonnyi
 * 100 is enough, as in cc-workspaces (WTEL-7906); the same cap identification by number uses
 * [WS-76](https://webitel.atlassian.net/browse/WS-76)
 */
const FOUND_CONTACTS_MAX_COUNT = 100;

export function useCallContact(call: MaybeRefOrGetter<Call>) {
	const callsStore = useCallsStore();
	const systemSettingsStore = useSystemSettingsStore();

	const identifiedContacts = ref<WebitelContactsContact[]>([]);
	const isIdentifying = ref(false);

	/**
	 * @author Oleksandr Palonnyi
	 * null until the agent searches; an empty list is a search that found nothing
	 * [WS-76](https://webitel.atlassian.net/browse/WS-76)
	 */
	const searchedContacts = ref<WebitelContactsContact[] | null>(null);
	const isSearching = ref(false);

	const isSearchActive = computed(() => searchedContacts.value !== null);

	/**
	 * @author Oleksandr Palonnyi
	 * the agent's search replaces the identification result while it is active, since it is what they are looking at
	 * [WS-76](https://webitel.atlassian.net/browse/WS-76)
	 */
	const contacts = computed(
		() => searchedContacts.value ?? identifiedContacts.value,
	);
	const isLoading = computed(() => isIdentifying.value || isSearching.value);

	// as in cc-workspaces: a hidden contact is neither shown nor searched for
	const isContactHidden = computed(
		() =>
			toValue(call).hideContact ||
			Boolean(
				systemSettingsStore.settings[EngineSystemSettingName.WbtHideContact],
			),
	);

	/**
	 * Watched along with the call: a contact linked while the call is open
	 * (by our own `setContact`, by another agent, or by a transfer) replaces
	 * whatever the search found or is still looking for, as in cc-workspaces.
	 */
	const linkedContactId = computed(() =>
		getCallContactId(toValue(call), callsStore.getCallById),
	);

	let lastSearchRequestId = 0;

	const resetSearch = () => {
		lastSearchRequestId += 1;
		searchedContacts.value = null;
		isSearching.value = false;
	};

	/**
	 * @author Oleksandr Palonnyi
	 * a new identification result (another call, a contact linked meanwhile) ends the search of the previous one
	 * [WS-76](https://webitel.atlassian.net/browse/WS-76)
	 */
	const showResult = (result: WebitelContactsContact[]) => {
		resetSearch();
		identifiedContacts.value = result;
		isIdentifying.value = false;
	};

	let lastRequestId = 0;

	const identify = async () => {
		const requestId = ++lastRequestId;
		const isStale = () => requestId !== lastRequestId;
		const currentCall = toValue(call);

		if (isContactHidden.value) return showResult([]);

		/**
		 * The contact linked here (the only one found, the agent's SELECT), or one
		 * of the found contacts linked by someone else, is already loaded: the
		 * socket event that links it shows it at once, with no request and no
		 * loader. Any other linked contact is loaded by its id.
		 * [WS-186](https://webitel.atlassian.net/browse/WS-186)
		 */
		const linkedId = linkedContactId.value;
		const loadedLinkedContact = linkedId
			? identifiedContacts.value.find(({ id }) => id === linkedId)
			: undefined;
		if (loadedLinkedContact)
			return showResult([
				loadedLinkedContact,
			]);

		resetSearch();
		identifiedContacts.value = [];
		isIdentifying.value = true;

		try {
			const identifiedResult = await identifyCallContact(
				currentCall,
				callsStore.getCallById,
			);
			if (!isStale()) showResult(identifiedResult);
		} catch {
			// error notification is shown by api-services
			if (!isStale()) showResult([]);
		}
	};

	/**
	 * Calls whose link is in flight. Kept per call: the panel outlives a call,
	 * and the SDK's socket requests have no timeout, so a hung link must block
	 * SELECT only on its own call.
	 */
	const linkingCallIds = new Set<string>();

	/**
	 * Links the contact the agent chose among several found. Shown at once, as
	 * the only found contact is, without waiting for the socket event.
	 */
	const selectContact = async (contact: WebitelContactsContact) => {
		const currentCall = toValue(call);
		if (linkingCallIds.has(currentCall.id)) return;
		linkingCallIds.add(currentCall.id);
		// a search started meanwhile (another call opened) owns the result
		const requestId = lastRequestId;

		try {
			await currentCall.setContact(Number(contact.id));
			if (requestId === lastRequestId)
				showResult([
					contact,
				]);
		} catch (err) {
			// as in cc-workspaces, the agent is not notified; the list stays to try again
			console.warn('[calls] linking the selected contact failed', err);
		} finally {
			linkingCallIds.delete(currentCall.id);
		}
	};

	/**
	 * @author Oleksandr Palonnyi
	 * a search only shows contacts and links nothing, the agent links one with SELECT; an empty query is no search
	 * [WS-76](https://webitel.atlassian.net/browse/WS-76)
	 */
	const search = async ({
		query,
		searchMode,
	}: {
		query: string;
		searchMode: SearchMode;
	}): Promise<void> => {
		const trimmedQuery = query.trim();
		if (!trimmedQuery) {
			resetSearch();
			return;
		}

		const requestId = ++lastSearchRequestId;
		const isStale = () => requestId !== lastSearchRequestId;
		isSearching.value = true;

		try {
			const {
				items,
			}: {
				items: WebitelContactsContact[];
			} = await ContactsAPI.getList({
				[searchMode]: trimmedQuery,
				size: FOUND_CONTACTS_MAX_COUNT,
				// shown from the search's answer, as the identified contacts are
				fields: CONTACT_FIELDS,
			});
			const foundContacts = items.filter(({ id }) => Boolean(id));
			if (!isStale()) searchedContacts.value = foundContacts;
		} catch {
			/**
			 * @author Oleksandr Palonnyi
			 * a failed search is not "nothing found": it ends the search, so the panel goes back to the identified contacts, and api-services notifies the agent
			 * [WS-76](https://webitel.atlassian.net/browse/WS-76)
			 */
			if (!isStale()) resetSearch();
		} finally {
			if (!isStale()) isSearching.value = false;
		}
	};

	watch(
		[
			() => toValue(call).id,
			linkedContactId,
			isContactHidden,
		],
		identify,
		{
			immediate: true,
		},
	);

	return {
		contacts,
		isLoading,
		isContactHidden,
		isSearchActive,
		selectContact,
		search,
		cancelSearch: resetSearch,
	};
}
