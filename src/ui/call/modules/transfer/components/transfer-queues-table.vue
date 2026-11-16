<template>
	<wt-table
		class="transfer-queues-table"
		:data="dataList"
		:headers="shownHeaders"
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
import { storeToRefs } from 'pinia';
import { computed, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTransferQueuesDataListStore } from '../store/transferQueuesDataList';
import type { TransferQueueRow } from '../types/CallTransfer.types';

const SEARCH_FILTER_NAME = 'search';

const props = defineProps<{
	search: string;
}>();

const selectedRowId = defineModel<string | null>('selectedRowId', {
	default: null,
});

const { t } = useI18n();

const store = useTransferQueuesDataListStore();
const { setupStore, appendToDataList, addFilter, $reset } = store;
const { dataList, shownHeaders, next, isLoading } = storeToRefs(store);

/**
 * @author Oleksandr Palonnyi
 * same loading scheme as the Agents tab (transfer-agents-table.vue): the first
 * page comes from the store's filter watcher once the search filter is added
 * after setupStore, and the singleton store is reset on unmount so the next
 * popup mounts clean
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
function applySearch(search: string): void {
	addFilter({
		name: SEARCH_FILTER_NAME,
		value: search,
	});
}

async function loadFirstPage(): Promise<void> {
	await setupStore();
	applySearch(props.search);
}

async function onLoading(): Promise<void> {
	if (isLoading.value || !next.value) return;
	await appendToDataList();
}

watch(() => props.search, applySearch);

loadFirstPage();

onUnmounted($reset);

const selectedRow = computed(
	() => dataList.value.find((row) => row.id === selectedRowId.value) ?? null,
);

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
