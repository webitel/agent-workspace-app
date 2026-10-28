<template>
	<wt-popup
		:size="ComponentSize.MD"
		:height="ComponentSize.LG"
		@close="callTransferStore.close()"
	>
		<template #title>
			{{ t('ui.call.transfer.title') }}
		</template>

		<template #main>
			<div class="call-transfer-popup">
				<div class="call-transfer-popup__number">
					<wt-input-text
						v-model="number"
						class="call-transfer-popup__number-input"
						:label="t('ui.call.transfer.numberLabel')"
						:placeholder="t('ui.call.transfer.numberPlaceholder')"
						:disabled="isSubmitting"
					/>
					<wt-button
						v-for="mode in transferModes"
						:key="mode"
						:color="ButtonColor.SECONDARY"
						:variant="ButtonVariant.OUTLINED"
						:disabled="isSubmitting || !availability.byNumber[mode]"
						@click="requestTransferToNumber(mode)"
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
					:value="searchQuery"
					@input="searchQuery = $event"
				/>

				<div class="call-transfer-popup__list wt-scrollbar">
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
				@click="callTransferStore.close()"
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
import { useCallTransferStore } from '../store/callTransfer';
import type { TransferRequest } from '../types/CallTransfer.types';

const emit = defineEmits<{
	transfer: [
		request: TransferRequest,
	];
}>();

const { t } = useI18n();
const callsStore = useCallsStore();
const callTransferStore = useCallTransferStore();

const transferModes = Object.values(TransferMode);

const number = ref('');
const activeTab = ref<TransferTab>(TransferTab.Agents);
const searchQuery = ref('');
const selectedRowId = ref<string | null>(null);
const isSubmitting = ref(false);

/**
 * @author Oleksandr Palonnyi
 * the tab bodies (the lists of agents, queues, users and dialplans) are
 * separate stories and not built yet, so no tab has a component here; a body
 * takes the search text and owns the selected row through
 * `v-model:selected-row-id`
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
		number: number.value,
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
	searchQuery.value = '';
}

/**
 * @author Oleksandr Palonnyi
 * only a blind transfer to a typed number is executed so far; the consult
 * and the tab rows are later stories and still just emit the request. On
 * success the popup is left open on purpose: it closes when the call leaves
 * the list, and on failure it keeps the typed number for another try
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
async function requestTransferToNumber(mode: TransferMode): Promise<void> {
	const destinationNumber = sanitizeDestination(number.value);

	if (mode !== TransferMode.Blind) {
		emit('transfer', {
			mode,
			destination: {
				kind: 'number',
				number: destinationNumber,
			},
		});
		return;
	}

	const { transferCallId } = callTransferStore;
	if (isSubmitting.value || transferCallId === null) return;

	isSubmitting.value = true;
	try {
		await callsStore.blindTransfer(transferCallId, destinationNumber);
	} finally {
		isSubmitting.value = false;
	}
}

function requestTransferToRow(mode: TransferMode): void {
	if (selectedRowId.value === null) return;

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
	isActiveCall(callsStore.getCallById(callTransferStore.transferCallId ?? '')),
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
		if (!isActive) callTransferStore.close();
	},
	{
		immediate: true,
	},
);
</script>

<style scoped>
.call-transfer-popup {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	height: 100%;
}

.call-transfer-popup__number {
	display: flex;
	align-items: flex-end;
	gap: var(--spacing-xs);
}

.call-transfer-popup__number-input {
	flex: 1;
}

.call-transfer-popup__list {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
}
</style>
