import type { ContactsInputContact } from '@webitel/api-services/gen/models';
import type {
	DefaultCommunicationTypes,
	NewContactDraft,
} from '../contact-create-form.types';

/**
 * @author Oleksandr Palonnyi
 * The backend takes a phone or an email only with its communication type, and
 * the form has no type field: the channel's default type is sent, as in
 * cc-workspaces. A channel without one sends none, and the backend's error is
 * shown rather than another type picked for the agent (ADR-0031)
 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
 */
export const toNewContactInput = (
	draft: NewContactDraft,
	defaultTypes: DefaultCommunicationTypes,
): ContactsInputContact => {
	const phoneNumber = draft.phoneNumber.trim();
	const email = draft.email.trim();
	const about = draft.description.trim();

	const contact: ContactsInputContact = {
		name: {
			commonName: draft.name.trim(),
		},
	};

	if (phoneNumber) {
		contact.phones = [
			{
				number: phoneNumber,
				primary: true,
				type: defaultTypes.phone,
			},
		];
	}

	if (email) {
		contact.emails = [
			{
				email,
				primary: true,
				type: defaultTypes.email,
			},
		];
	}

	/**
	 * @author Oleksandr Palonnyi
	 * the generated input types require an etag even on create, where there is no version yet; an empty one is what cc-workspaces sends
	 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
	 */
	const newRecordEtag = '';

	if (draft.timezone) {
		contact.timezones = [
			{
				etag: newRecordEtag,
				timezone: draft.timezone,
			},
		];
	}

	if (draft.owner) {
		contact.managers = [
			{
				etag: newRecordEtag,
				primary: true,
				user: draft.owner,
			},
		];
	}

	if (draft.labels.length) {
		contact.labels = draft.labels.map(({ label }) => ({
			label,
		}));
	}

	if (about) contact.about = about;

	return contact;
};
