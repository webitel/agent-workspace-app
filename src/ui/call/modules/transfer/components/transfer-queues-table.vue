<template>
	<wt-table
		class="transfer-queues-table"
		:data="dataList"
		:headers="shownHeaders"
		:active-row="selectedRow"
		clickable-rows
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
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useTransferTabList } from '../composables/useTransferTabList';
import { useTransferQueuesDataListStore } from '../store/transferQueuesDataList';
import type { TransferQueueRow } from '../types/CallTransfer.types';

const props = defineProps<{
	search: string;
}>();

const selectedRowId = defineModel<string | null>('selectedRowId', {
	default: null,
});

const { t } = useI18n();

const store = useTransferQueuesDataListStore();
const { dataList, shownHeaders, isLoading, next } = storeToRefs(store);

const { selectedRow, onLoading, onRowClick } =
	useTransferTabList<TransferQueueRow>({
		store,
		dataList,
		isLoading,
		next,
		search: () => props.search,
		selectedRowId,
	});
</script>

<style scoped>
.transfer-queues-table__cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}
</style>
