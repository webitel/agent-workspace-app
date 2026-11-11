<template>
	<wt-table
		class="transfer-agents-table"
		:data="dataList"
		:headers="shownHeaders"
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
import { onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UsernameTableCell from '../../../../pages/components/username-table-cell.vue';
import { useTransferAgentsDataListStore } from '../store/transferAgentsDataList';
import type { TransferAgentRow } from '../types/CallTransfer.types';
import TransferStatusCell from './transfer-status-cell.vue';

const SEARCH_FILTER_NAME = 'search';

const props = defineProps<{
	search: string;
}>();

const selectedRowId = defineModel<string | null>('selectedRowId', {
	default: null,
});

const { t } = useI18n();

const store = useTransferAgentsDataListStore();
const { setupStore, appendToDataList, addFilter, $reset } = store;
const { dataList, shownHeaders, next, isLoading } = storeToRefs(store);

/**
 * @author Oleksandr Palonnyi
 * the first page is loaded by the store's own filter watcher, which reloads
 * from page 1 whenever a filter changes once the store is set up. Adding the
 * search filter after setupStore is that change, so every mount loads exactly
 * once; `initialize` would load as well and, on a remount, race the watcher.
 * The store is a singleton and the popup opens many times, so it is reset on
 * unmount, which also drops the search filter for the next mount to add.
 * addFilter replaces a filter of the same name, so a search typed while the
 * store is still being set up needs no separate path
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

function getRowClass(row: TransferAgentRow): string {
	return row.id === selectedRowId.value
		? 'transfer-agents-table__row--selected'
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
.transfer-agents-table__cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.transfer-agents-table :deep(tbody tr) {
	cursor: pointer;
}

/**
 * @author Oleksandr Palonnyi
 * the row token is workspace-scoped, so the selected-row style lives here and
 * not in the shared wt-table. getRowClass puts the class on the tr only; the
 * cells are coloured too, through the `> td` selector
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
.transfer-agents-table :deep(tr.transfer-agents-table__row--selected),
.transfer-agents-table
	:deep(tr.transfer-agents-table__row--selected > td) {
	background: var(--wt-ws-table-colors-row-selected-background);
}
</style>
