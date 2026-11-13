import { EngineSystemSettingName } from '@webitel/api-services/gen/models';
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue';

import { findContactIdsByNumber } from '../../../../../features/calls/modules/contact/scripts/findContactIdsByNumber';
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

	const contactIds = ref<string[]>([]);
	const isLoading = ref(false);

	// as for a call: a hidden contact is neither shown nor searched for
	const isContactHidden = computed(() =>
		Boolean(
			systemSettingsStore.settings[EngineSystemSettingName.WbtHideContact],
		),
	);

	const showResult = (ids: string[]) => {
		contactIds.value = ids;
		isLoading.value = false;
	};

	let lastRequestId = 0;

	const identify = async () => {
		const requestId = ++lastRequestId;
		const isStale = () => requestId !== lastRequestId;
		const number = toValue(phoneNumber);

		if (isContactHidden.value || !number) return showResult([]);

		contactIds.value = [];
		isLoading.value = true;

		try {
			const foundContactIds = await findContactIdsByNumber(number);
			if (!isStale()) showResult(foundContactIds);
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
		contactIds,
		isLoading,
		isContactHidden,
	};
}
