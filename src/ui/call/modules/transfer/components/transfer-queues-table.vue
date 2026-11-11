<template>
	<wt-table
		class="transfer-queues-table"
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
		@row-click="onRowClick"
	>
		<template #name="{ item }">
			<div class="transfer-queues-table__cell">
				<wt-icon icon="ws-robot" />
				{{ item.name }}
			</div>
		</template>

		<template #description="{ item }">
			<div class="transfer-queues-table__cell">
				{{ item.description }}
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
import { useTransferQueueList } from '../composables/useTransferQueueList';
import type { TransferQueueRow } from '../types/CallTransfer.types';

const props = defineProps<{
	search: string;
}>();

const selectedRowId = defineModel<string | null>('selectedRowId', {
	default: null,
});

const { t } = useI18n();

const { rows, isLoading, loadNextPage } = useTransferQueueList(
	toRef(props, 'search'),
);

const headers = computed(() => [
	{
		value: 'name',
		text: t('ui.call.transfer.columns.name'),
	},
	{
		value: 'description',
		text: t('ui.call.transfer.columns.description'),
	},
]);

function getRowClass(row: TransferQueueRow): string {
	return row.id === selectedRowId.value ? 'wt-table__row--selected' : '';
}

async function onLoading(): Promise<void> {
	await loadNextPage();
}

/**
 * @author Oleksandr Palonnyi
 * a second click on the selected row clears the selection, the same as on the
 * Agents tab, so the tabs behave alike
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
function onRowClick({ data: row }: { data: TransferQueueRow }): void {
	selectedRowId.value = selectedRowId.value === row.id ? null : row.id;
}
</script>

<style scoped>
/**
 * @author Oleksandr Palonnyi
 * the row token is workspace-scoped, so the selected-row style lives here and
 * not in the shared wt-table; the class is set by getRowClass on the rendered
 * tr and its cells
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
.transfer-queues-table :deep(tr.wt-table__row--selected),
.transfer-queues-table :deep(tr.wt-table__row--selected > td) {
	background: var(--wt-ws-table-colors-row-selected-background);
}

.transfer-queues-table__cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	cursor: pointer;
}
</style>
