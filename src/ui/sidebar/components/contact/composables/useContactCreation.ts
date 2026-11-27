import { CommunicationsAPI, ContactsAPI } from '@webitel/api-services/api';
import {
	EngineCommunicationChannels,
	type EngineCommunicationType,
	type WebitelContactsLookup,
} from '@webitel/api-services/gen/models';
import { type Ref, ref } from 'vue';
import type {
	DefaultCommunicationTypes,
	NewContactDraft,
} from '../contact-create-form.types';
import { toNewContactInput } from '../scripts/toNewContactInput';

const loadDefaultCommunicationTypes = async (
	draft: NewContactDraft,
): Promise<DefaultCommunicationTypes> => {
	if (!draft.phoneNumber.trim() && !draft.email.trim()) return {};

	const {
		items,
	}: {
		items: EngineCommunicationType[];
	} = await CommunicationsAPI.getList({
		channel: [
			EngineCommunicationChannels.Phone,
			EngineCommunicationChannels.Email,
		],
		default: true,
	});

	const findDefaultTypeOfChannel = (
		channel: EngineCommunicationChannels,
	): WebitelContactsLookup | undefined => {
		const defaultType = items.find((type) => type.channel === channel);
		return defaultType
			? {
					id: defaultType.id,
					name: defaultType.name,
				}
			: undefined;
	};

	return {
		phone: findDefaultTypeOfChannel(EngineCommunicationChannels.Phone),
		email: findDefaultTypeOfChannel(EngineCommunicationChannels.Email),
	};
};

export interface UseContactCreationReturn {
	isSaving: Ref<boolean>;
	createContact: (draft: NewContactDraft) => Promise<string | null>;
}

/**
 * @author Oleksandr Palonnyi
 * Saves a contact from the create form and returns its id, or null when
 * nothing was created. The form only checks and hands over what was typed, as
 * the contact card's add form does (WS-171), so what follows the save stays
 * with the panel: the Contacts panel shows the contact, the call panel links
 * it. A repeated SAVE while one is in flight is ignored
 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
 */
export function useContactCreation(): UseContactCreationReturn {
	const isSaving = ref(false);

	const createContact = async (
		draft: NewContactDraft,
	): Promise<string | null> => {
		if (isSaving.value) return null;
		isSaving.value = true;

		try {
			const defaultTypes = await loadDefaultCommunicationTypes(draft);
			const createdContact = await ContactsAPI.add({
				itemInstance: toNewContactInput(draft, defaultTypes),
			});
			return createdContact?.id ? String(createdContact.id) : null;
		} catch {
			/**
			 * @author Oleksandr Palonnyi
			 * api-services has notified the agent; the form stays open with what they typed
			 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
			 */
			return null;
		} finally {
			isSaving.value = false;
		}
	};

	return {
		isSaving,
		createContact,
	};
}
