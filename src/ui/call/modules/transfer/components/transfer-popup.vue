<template>
	<wt-popup
		:size="ComponentSize.MD"
		:height="ComponentSize.LG"
		@close="callTransferPopupStore.close()"
	>
		<template #title>
			{{ t('ui.call.transfer.title') }}
		</template>

		<template #main>
			<div class="transfer-popup__main">
				<div class="transfer-popup__phone">
					<wt-input-text
						v-model="phone"
						class="transfer-popup__phone-input"
						:label="t('ui.call.transfer.phoneLabel')"
						:placeholder="t('ui.call.transfer.phonePlaceholder')"
						:disabled="isSubmitting"
					/>
					<wt-button
						v-for="mode in transferModes"
						:key="mode"
						:color="ButtonColor.SECONDARY"
						:variant="ButtonVariant.OUTLINED"
						:disabled="isSubmitting || !availability.byPhone[mode]"
						@click="requestTransferToPhone(mode)"
					>
						{{ t(`ui.call.transfer.modes.${mode}`) }}
					</wt-button>
				</div>

				<wt-tabs
					:current="activeTabConfig"
					:tabs="tabs"
					@change="onTabChange"
				/>

				<wt-search-bar
					full-width
					:value="searchInput"
					@input="searchInput = $event"
					@search="searchQuery = $event"
				/>

				<div class="transfer-popup__list wt-scrollbar">
					<component
						:is="activeTabConfig.component"
						v-if="activeTabConfig.component"
						v-model:selected-row-id="selectedRowId"
						:search="searchQuery"
					/>
				</div>
			</div>
		</template>

		<template #actions>
			<wt-button
				v-for="mode in transferModes"
				:key="mode"
				:color="ButtonColor.SECONDARY"
				:disabled="isSubmitting || !availability.bySelection[mode]"
				@click="requestTransferToRow(mode)"
			>
				{{ t(`ui.call.transfer.modes.${mode}`) }}
			</wt-button>
			<wt-button
				:color="ButtonColor.SECONDARY"
				@click="callTransferPopupStore.close()"
			>
				{{ t('reusable.cancel') }}
			</wt-button>
		</template>
	</wt-popup>
</template>

<script
	setup
	lang="ts"
>
import {
	ButtonColor,
	ButtonVariant,
	ComponentSize,
} from '@webitel/ui-sdk/enums';
import { type Component, computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { isActiveCall } from '../../../../../features/calls/scripts/isActiveCall';
import { sanitizeDestination } from '../../../../../features/calls/scripts/sanitizeDestination';
import { useCallsStore } from '../../../../../features/calls/store/calls';
import { TransferMode } from '../enums/TransferMode.enum';
import { TransferTab } from '../enums/TransferTab.enum';
import { getTransferActionAvailability } from '../scripts/getTransferActionAvailability';
import { useCallTransferPopupStore } from '../store/callTransferPopup';
import type { TransferRequest } from '../types/CallTransfer.types';
import TransferAgentsTable from './transfer-agents-table.vue';

const emit = defineEmits<{
	transfer: [
		request: TransferRequest,
	];
}>();

const { t } = useI18n();
const callsStore = useCallsStore();
const callTransferPopupStore = useCallTransferPopupStore();

const transferModes = Object.values(TransferMode);

const phone = ref('');
const activeTab = ref<TransferTab>(TransferTab.Agents);

/**
 * @author Oleksandr Palonnyi
 * `searchInput` is the text in the field; `searchQuery` is what the list
 * searches by. wt-search-bar emits `search` debounced (and on Enter), so the
 * list is not requested on every typed character. The table store applies the
 * last answer to arrive, not the answer to the last request, so with a request
 * per character a slow answer to "a" could replace the list for "ab". The
 * debounce makes that rare, it does not remove it: the fix belongs in
 * ui-datalist (see docs/adr/0016-transfer-agents-list.md)
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
const searchInput = ref('');
const searchQuery = ref('');
const selectedRowId = ref<string | null>(null);
const isSubmitting = ref(false);

/**
 * @author Oleksandr Palonnyi
 * the tab bodies are built one per PR, a tab without a component shows an
 * empty list area; a body takes the search text and owns the selected row
 * through `v-model:selected-row-id`
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
const tabs = computed<
	{
		value: TransferTab;
		text: string;
		component?: Component;
	}[]
>(() => [
	{
		value: TransferTab.Agents,
		text: t('objects.agent.agent', 2),
		component: TransferAgentsTable,
	},
	{
		value: TransferTab.Queues,
		text: t('objects.queue.queue', 2),
	},
	{
		value: TransferTab.Users,
		text: t('objects.user', 2),
	},
	{
		value: TransferTab.Dialplans,
		text: t('WtApplication.admin.sections.dialplan'),
	},
]);

const activeTabConfig = computed(
	() =>
		tabs.value.find(({ value }) => value === activeTab.value) ?? tabs.value[0],
);

const availability = computed(() =>
	getTransferActionAvailability({
		phone: phone.value,
		tab: activeTab.value,
		hasSelection: selectedRowId.value !== null,
	}),
);

/**
 * @author Oleksandr Palonnyi
 * a row and a search belong to one list, so switching tabs drops both; the
 * typed number is the agent's own input and stays (AC_13.07.12)
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
function onTabChange(tab: { value: TransferTab }): void {
	activeTab.value = tab.value;
	selectedRowId.value = null;
	searchInput.value = '';
	searchQuery.value = '';
}

/**
 * @author Oleksandr Palonnyi
 * only a blind transfer to a typed number is executed so far; the consult
 * to a typed number is a later story and still just emits the request. On
 * success the popup is left open on purpose: it closes when the call leaves
 * the list, and on failure it keeps the typed number for another try
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
async function requestTransferToPhone(mode: TransferMode): Promise<void> {
	const destinationPhone = sanitizeDestination(phone.value);

	if (mode !== TransferMode.Blind) {
		emit('transfer', {
			mode,
			destination: {
				kind: 'phone',
				phone: destinationPhone,
			},
		});
		return;
	}

	const { transferCallId } = callTransferPopupStore;
	if (isSubmitting.value || transferCallId === null) return;

	isSubmitting.value = true;
	try {
		await callsStore.blindTransfer(transferCallId, destinationPhone);
	} finally {
		isSubmitting.value = false;
	}
}

/**
 * @author Oleksandr Palonnyi
 * only a consult to an Agents row is executed so far, the other tabs are later
 * stories and still just emit the request. Unlike a blind transfer the original
 * call stays in the list, so the popup is closed here on success instead of
 * waiting for the call to leave
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
async function requestTransferToRow(mode: TransferMode): Promise<void> {
	if (selectedRowId.value === null) return;

	if (mode === TransferMode.Consult && activeTab.value === TransferTab.Agents) {
		const { transferCallId } = callTransferPopupStore;
		if (isSubmitting.value || transferCallId === null) return;

		isSubmitting.value = true;
		try {
			const isConsultPlaced = await callsStore.consultTransferToAgent(
				transferCallId,
				selectedRowId.value,
			);
			if (isConsultPlaced) callTransferPopupStore.close();
		} finally {
			isSubmitting.value = false;
		}
		return;
	}

	emit('transfer', {
		mode,
		destination: {
			kind: 'row',
			tab: activeTab.value,
			rowId: selectedRowId.value,
		},
	});
}

const isTransferredCallActive = computed(() =>
	isActiveCall(
		callsStore.getCallById(callTransferPopupStore.transferCallId ?? ''),
	),
);

/**
 * @author Oleksandr Palonnyi
 * a call that ends while the popup is open (the client hung up, or it was
 * ended on another device) has nothing left to transfer
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
watch(
	isTransferredCallActive,
	(isActive) => {
		if (!isActive) callTransferPopupStore.close();
	},
	{
		immediate: true,
	},
);
</script>

<style scoped>
.transfer-popup__main {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	height: 100%;
}

.transfer-popup__phone {
	display: flex;
	align-items: flex-end;
	gap: var(--spacing-xs);
}

.transfer-popup__phone-input {
	flex: 1;
}

.transfer-popup__list {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
}
</style>
