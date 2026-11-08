<template>
	<wt-table
		class="call-transfer-agents-table"
		:data="rows"
		:headers="headers"
		:row-class="getRowClass"
		:loading="isLoading"
		:on-loading="loadNextPage"
		:selectable="false"
		:grid-actions="false"
		data-key="id"
		headless
		lazy
		@row-click="onRowClick"
	>
		<template #name="{ item }">
			<div class="call-transfer-agents-table__cell">
				<wt-avatar
					:size="ComponentSize.SM"
					:username="item.name"
				/>
				{{ item.name }}
			</div>
		</template>

		<template #status="{ item }">
			<div class="call-transfer-agents-table__cell">
				<wt-badge
					:hidden="!item.status"
					:icon-badge="item.status"
					:color-variable="getBadgeColorVariable(item.status)"
				/>
				{{ getStatusLabel(item.status) }}
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
import { ComponentSize } from '@webitel/ui-sdk/enums';
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
		value: 'teamName',
		text: t('ui.call.transfer.columns.team'),
	},
]);

function getBadgeColorVariable(
	status?: TransferAgentStatus,
): string | undefined {
	return status && TRANSFER_AGENT_BADGE_COLOR_VARIABLES[status];
}

/**
 * @author Oleksandr Palonnyi
 * TODO: the label is drawn beside wt-badge by hand until the component can
 * show a status text itself; refactor after that component update
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
function getStatusLabel(status?: TransferAgentStatus): string {
	return status ? t(TRANSFER_AGENT_STATUS_LABEL_KEYS[status]) : '';
}

function getRowClass(row: TransferAgentRow): string {
	return row.id === selectedRowId.value
		? 'call-transfer-agents-table__row--selected'
		: '';
}

/**
 * @author Oleksandr Palonnyi
 * a second click on the selected row clears the selection, as AC_13.07.10
 * describes for the Users tab; it is applied to every tab so they behave alike
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
function onRowClick({ data: row }: { data: TransferAgentRow }): void {
	selectedRowId.value = selectedRowId.value === row.id ? null : row.id;
}
</script>

<style scoped>
.call-transfer-agents-table__cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.call-transfer-agents-table :deep(tbody tr) {
	cursor: pointer;
}

/**
 * @author Oleksandr Palonnyi
 * the row token is workspace-scoped, so the selected-row style lives here and
 * not in the shared wt-table. getRowClass puts the class on the tr only; the
 * cells are coloured too, through the `> td` selector
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
.call-transfer-agents-table :deep(tr.call-transfer-agents-table__row--selected),
.call-transfer-agents-table
	:deep(tr.call-transfer-agents-table__row--selected > td) {
	background: var(--wt-ws-table-colors-row-selected-background);
}
</style>
