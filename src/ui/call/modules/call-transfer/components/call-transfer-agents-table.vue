<template>
	<wt-table
		class="call-transfer-agents-table"
		:data="rows"
		:headers="headers"
		:row-class="getRowClass"
		:loading="isLoading"
		:on-loading="onLoading"
		:selectable="false"
		:grid-actions="false"
		data-key="id"
		headless
		lazy
	>
		<template #name="{ item }">
			<div
				class="call-transfer-agents-table__cell"
				@click="onRowClick(item.id)"
			>
				<wt-avatar
					size="sm"
					:username="item.name"
				/>
				{{ item.name }}
			</div>
		</template>

		<template #status="{ item }">
			<div
				class="call-transfer-agents-table__cell"
				@click="onRowClick(item.id)"
			>
<!-- TODO refactor after badge migrate -->
				<wt-badge
					:hidden="!item.status"
					:icon-badge="item.status"
					:color-variable="getBadgeColorVariable(item.status)"
				/>
				{{ getStatusLabel(item.status) }}
			</div>
		</template>

		<template #team="{ item }">
			<div
				class="call-transfer-agents-table__cell"
				@click="onRowClick(item.id)"
			>
				{{ item.teamName }}
			</div>
		</template>

		<template #empty>
			{{ t('ui.call.transfer.emptyList') }}
		</template>
	</wt-table>
</template>

<script
	setup
	lang="ts"
>
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTransferAgentList } from '../composables/useTransferAgentList';
import { TRANSFER_AGENT_BADGE_COLOR_VARIABLES } from '../constants/transferAgentStatusColors';
import { TRANSFER_AGENT_STATUS_LABEL_KEYS } from '../constants/transferAgentStatusLabelKeys';
import type { TransferAgentStatus } from '../enums/TransferAgentStatus.enum';
import type { TransferAgentRow } from '../types/CallTransfer.types';

const props = defineProps<{
	search: string;
}>();

const selectedRowId = defineModel<string | null>('selectedRowId', {
	default: null,
});

const { t } = useI18n();

const { rows, isLoading, loadNextPage } = useTransferAgentList(
	toRef(props, 'search'),
);

const headers = computed(() => [
	{
		value: 'name',
		text: t('ui.call.transfer.columns.name'),
	},
	{
		value: 'status',
		text: t('ui.call.transfer.columns.status'),
	},
	{
		value: 'team',
		text: t('ui.call.transfer.columns.team'),
	},
]);

function getBadgeColorVariable(
	status?: TransferAgentStatus,
): string | undefined {
	return status && TRANSFER_AGENT_BADGE_COLOR_VARIABLES[status];
}

function getStatusLabel(status?: TransferAgentStatus): string {
	return status ? t(TRANSFER_AGENT_STATUS_LABEL_KEYS[status]) : '';
}

function getRowClass(row: TransferAgentRow): string {
	return row.id === selectedRowId.value
		? 'call-transfer-agents-table__row--selected'
		: '';
}

async function onLoading(): Promise<void> {
	await loadNextPage();
}

/**
 * @author Oleksandr Palonnyi
 * wt-table does not forward a row click, so every cell reports it itself. A
 * second click on the selected row clears the selection, as AC_13.07.10
 * describes for the Users tab; it is applied to every tab so they behave alike
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
function onRowClick(rowId: string): void {
	selectedRowId.value = selectedRowId.value === rowId ? null : rowId;
}
</script>

<style scoped>
.call-transfer-agents-table__cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	cursor: pointer;
}

.call-transfer-agents-table :deep(.call-transfer-agents-table__row--selected) {
	box-shadow: inset 0 0 0 1px var(--primary-color);
}
</style>
