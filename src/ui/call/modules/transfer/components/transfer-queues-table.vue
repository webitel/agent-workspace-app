<template>
	<wt-table
		class="transfer-queues-table"
		:data="rows"
		:headers="headers"
		:active-row="selectedRow"
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

const selectedRow = computed(
	() => rows.value.find((row) => row.id === selectedRowId.value) ?? null,
);

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
.transfer-queues-table__cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	cursor: pointer;
}
</style>
