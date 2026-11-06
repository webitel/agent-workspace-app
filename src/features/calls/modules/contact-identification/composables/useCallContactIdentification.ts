import { EngineSystemSettingName } from '@webitel/api-services/gen/models';
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue';
import type { Call } from 'webitel-sdk';

import { useSystemSettingsStore } from '../../../../system-settings/store/systemSettings';
import { useCallsStore } from '../../../store/calls';
import { getCallContactId } from '../scripts/getCallContactId';
import { identifyCallContact } from '../scripts/identifyCallContact';

export function useCallContactIdentification(call: MaybeRefOrGetter<Call>) {
	const callsStore = useCallsStore();
	const systemSettingsStore = useSystemSettingsStore();

	const contactIds = ref<string[]>([]);
	const isLoading = ref(false);

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

	const showResult = (ids: string[]) => {
		contactIds.value = ids;
		isLoading.value = false;
	};

	let lastRequestId = 0;

	const identify = async () => {
		const requestId = ++lastRequestId;
		const isStale = () => requestId !== lastRequestId;
		const currentCall = toValue(call);

		if (isContactHidden.value) return showResult([]);

		// already known: no request, no loader
		if (linkedContactId.value)
			return showResult([
				linkedContactId.value,
			]);

		contactIds.value = [];
		isLoading.value = true;

		try {
			const foundContactIds = await identifyCallContact(
				currentCall,
				callsStore.getCallById,
			);
			if (!isStale()) showResult(foundContactIds);
		} catch {
			// error notification is shown by api-services
			if (!isStale()) showResult([]);
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
		contactIds,
		isLoading,
		isContactHidden,
	};
}
