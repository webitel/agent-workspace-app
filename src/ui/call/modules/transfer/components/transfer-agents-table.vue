<template>
	<wt-table
		class="transfer-agents-table"
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
			<div class="transfer-agents-table__cell">
				<username-table-cell :name="item.name" />
			</div>
		</template>

		<template #status="{ item }">
			<transfer-status-cell :status="item.status" />
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
import UsernameTableCell from '../../../../pages/components/username-table-cell.vue';
import { useTransferTabList } from '../composables/useTransferTabList';
import { useTransferAgentsDataListStore } from '../store/transferAgentsDataList';
import type { TransferAgentRow } from '../types/CallTransfer.types';
import TransferStatusCell from './transfer-status-cell.vue';

const props = defineProps<{
	search: string;
}>();

const selectedRowId = defineModel<string | null>('selectedRowId', {
	default: null,
});

const { t } = useI18n();

const store = useTransferAgentsDataListStore();
const { dataList, shownHeaders, isLoading, next } = storeToRefs(store);

const { selectedRow, onLoading, onRowClick } =
	useTransferTabList<TransferAgentRow>({
		store,
		dataList,
		isLoading,
		next,
		search: () => props.search,
		selectedRowId,
	});
</script>

<style scoped>
.transfer-agents-table__cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}
</style>
