import {
	EngineSystemSettingName,
	type WebitelContactsContact,
} from '@webitel/api-services/gen/models';
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue';

import {
	createContactReloader,
	replaceContact,
} from '../../../../../features/calls/modules/contact/scripts/createContactReloader';
import { findContactsByNumber } from '../../../../../features/calls/modules/contact/scripts/findContactsByNumber';
import { useSystemSettingsStore } from '../../../../../features/system-settings/store/systemSettings';

/**
 * The contacts holding a number, searched as a live call's are, for a table
 * row that carries the number but no linked contact (an offline member, a
 * missed call). Nothing is linked: there is no live call to link a contact to.
 * [WS-30](https://webitel.atlassian.net/browse/WS-30)
 * [WS-33](https://webitel.atlassian.net/browse/WS-33)
 */
export function useContactIdentificationByNumber(
	phoneNumber: MaybeRefOrGetter<string | undefined>,
) {
	const systemSettingsStore = useSystemSettingsStore();

	const contacts = ref<WebitelContactsContact[]>([]);
	const isLoading = ref(false);

	// as for a call: a hidden contact is neither shown nor searched for
	const isContactHidden = computed(() =>
		Boolean(
			systemSettingsStore.settings[EngineSystemSettingName.WbtHideContact],
		),
	);

	const showResult = (result: WebitelContactsContact[]) => {
		contacts.value = result;
		isLoading.value = false;
	};

	/**
	 * The card added a phone or an email to a found contact: it is reloaded and
	 * put in its place, so switching away from it and back keeps what was added
	 * [WS-186](https://webitel.atlassian.net/browse/WS-186)
	 */
	const reloadContact = createContactReloader((contact) => {
		contacts.value = replaceContact(contacts.value, contact);
	});

	let lastRequestId = 0;

	const identify = async () => {
		const requestId = ++lastRequestId;
		const isStale = () => requestId !== lastRequestId;
		const number = toValue(phoneNumber);

		if (isContactHidden.value || !number) return showResult([]);

		contacts.value = [];
		isLoading.value = true;

		try {
			const foundContacts = await findContactsByNumber(number);
			if (!isStale()) showResult(foundContacts);
		} catch {
			// error notification is shown by api-services
			if (!isStale()) showResult([]);
		}
	};

	watch(
		[
			() => toValue(phoneNumber),
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
		reloadContact,
	};
}
