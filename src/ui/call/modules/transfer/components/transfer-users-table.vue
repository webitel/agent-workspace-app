<template>
	<wt-table
		class="transfer-users-table"
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
			<div class="transfer-users-table__cell">
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
import { useTransferUsersDataListStore } from '../store/transferUsersDataList';
import type { TransferUserRow } from '../types/CallTransfer.types';
import TransferStatusCell from './transfer-status-cell.vue';

const SEARCH_FILTER_NAME = 'search';

const props = defineProps<{
	search: string;
}>();

const selectedRowId = defineModel<string | null>('selectedRowId', {
	default: null,
});

const { t } = useI18n();

const store = useTransferUsersDataListStore();
const { setupStore, appendToDataList, addFilter, $reset } = store;
const { dataList, shownHeaders, next, isLoading } = storeToRefs(store);

/**
 * @author Oleksandr Palonnyi
 * same loading as the Agents table (see ADR-0013): the first page is loaded by
 * the store's own filter watcher once the search filter is added after
 * setupStore, so every mount loads exactly once. The store is a singleton and
 * the popup opens many times, so it is reset on unmount
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

function getRowClass(row: TransferUserRow): string {
	return row.id === selectedRowId.value
		? 'transfer-users-table__row--selected'
		: '';
}

/**
 * @author Oleksandr Palonnyi
 * a second click on the selected row clears the selection (AC_13.07.10)
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
function onRowClick({ data: row }: { data: TransferUserRow }): void {
	selectedRowId.value = selectedRowId.value === row.id ? null : row.id;
}
</script>

<style scoped>
.transfer-users-table__cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.transfer-users-table :deep(tbody tr) {
	cursor: pointer;
}

/**
 * @author Oleksandr Palonnyi
 * the row token is workspace-scoped, so the selected-row style lives here and
 * not in the shared wt-table. getRowClass puts the class on the tr only; the
 * cells are coloured too, through the `> td` selector
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
.transfer-users-table :deep(tr.transfer-users-table__row--selected),
.transfer-users-table :deep(tr.transfer-users-table__row--selected > td) {
	background: var(--wt-ws-table-colors-row-selected-background);
}
</style>
