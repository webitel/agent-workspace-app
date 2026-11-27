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
import {
	createContactReloader,
	replaceContact,
} from '../scripts/createContactReloader';
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
	 * The call is linked to a contact that failed to load (no access, network).
	 * It is not "no contact": the panel must not offer the Unknown contact for a
	 * linked call. api-services notifies the agent of the failure.
	 * [WS-186](https://webitel.atlassian.net/browse/WS-186)
	 */
	const hasLinkedContactFailed = ref(false);

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

	// the agent's search shows its own result over it, and Cancel brings it back
	const isLinkedContactUnavailable = computed(
		() => hasLinkedContactFailed.value && !isSearchActive.value,
	);

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
	/**
	 * What the number search found while the identification still runs (the
	 * only match is being linked). Not shown: a failed link shows nothing.
	 * [WS-186](https://webitel.atlassian.net/browse/WS-186)
	 */
	let pendingContacts: WebitelContactsContact[] = [];

	/**
	 * Calls whose link is in flight. Kept per call: the panel outlives a call,
	 * and the SDK's socket requests have no timeout, so a hung link must block
	 * SELECT only on its own call.
	 */
	/**
	 * @author Oleksandr Palonnyi
	 * Each in-flight link keeps the contact being linked. A contact created in the
	 * panel is in no list yet, so without it a socket event that comes before
	 * `setContact` resolves would load the contact a second time, behind the loader
	 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
	 */
	const linkingContacts = new Map<string, WebitelContactsContact>();

	/**
	 * A contact the panel already holds: shown, searched, or found and being
	 * linked. The socket event of a link made here may come before
	 * `setContact` resolves, as the SDK does not order a reply and an event, so
	 * the link is looked up in all of them.
	 * [WS-186](https://webitel.atlassian.net/browse/WS-186)
	 */
	const findKnownContact = (contactId: string) =>
		[
			...(searchedContacts.value ?? []),
			...identifiedContacts.value,
			...pendingContacts,
			...linkingContacts.values(),
		].find(({ id }) => id === contactId);

	const showResult = (result: WebitelContactsContact[]) => {
		resetSearch();
		pendingContacts = [];
		identifiedContacts.value = result;
		hasLinkedContactFailed.value = false;
		isIdentifying.value = false;
	};

	const showLinkedContactFailed = () => {
		showResult([]);
		hasLinkedContactFailed.value = true;
	};

	/**
	 * The card added a phone or an email to a contact the panel holds: it is
	 * reloaded and put in its place in every list that holds it, so switching
	 * away from it and back keeps what was added
	 * [WS-186](https://webitel.atlassian.net/browse/WS-186)
	 */
	const reloadContact = createContactReloader((contact) => {
		identifiedContacts.value = replaceContact(
			identifiedContacts.value,
			contact,
		);
		if (searchedContacts.value)
			searchedContacts.value = replaceContact(searchedContacts.value, contact);
		pendingContacts = replaceContact(pendingContacts, contact);
	});

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
		const knownLinkedContact = linkedId
			? findKnownContact(linkedId)
			: undefined;
		if (knownLinkedContact)
			return showResult([
				knownLinkedContact,
			]);

		resetSearch();
		pendingContacts = [];
		identifiedContacts.value = [];
		hasLinkedContactFailed.value = false;
		isIdentifying.value = true;

		try {
			const identifiedResult = await identifyCallContact(
				currentCall,
				callsStore.getCallById,
				(foundContacts) => {
					if (!isStale()) pendingContacts = foundContacts;
				},
			);
			if (!isStale()) showResult(identifiedResult);
		} catch {
			// error notification is shown by api-services; a failed load of the
			// linked contact is not a failed search
			if (isStale()) return;
			if (linkedId) showLinkedContactFailed();
			else showResult([]);
		}
	};

	/**
	 * Links the contact the agent chose among several found, or created in the
	 * panel. Shown at once, as
	 * the only found contact is, without waiting for the socket event.
	 */
	const selectContact = async (contact: WebitelContactsContact) => {
		const currentCall = toValue(call);
		if (linkingContacts.has(currentCall.id)) return;
		linkingContacts.set(currentCall.id, contact);
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
			linkingContacts.delete(currentCall.id);
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
		isLinkedContactUnavailable,
		isSearchActive,
		selectContact,
		reloadContact,
		search,
		cancelSearch: resetSearch,
	};
}
