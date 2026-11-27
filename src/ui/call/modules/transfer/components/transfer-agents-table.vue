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
import { computed, onUnmounted, watch } from 'vue';
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
const { setupStore, appendToDataList, addFilter } = store;
const { dataList, shownHeaders, next, isLoading } = storeToRefs(store);

/**
 * @author Oleksandr Palonnyi
 * the first page is loaded by the store's own filter watcher, which reloads
 * from page 1 whenever a filter changes once the store is set up. Adding the
 * search filter after setupStore is that change, so every mount loads exactly
 * once; `initialize` would load as well and, on a remount, race the watcher.
 * addFilter replaces a filter of the same name, so a search typed while the
 * store is still being set up needs no separate path (ADR-0016)
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

/**
 * @author Oleksandr Palonnyi
 * the store is a singleton the popup remounts many times, yet it is not
 * `$reset`: that clears the filters while the store stays set up, so its
 * filter watcher sends a request for a list no longer shown. Only the rows
 * go, so a remount does not show the old ones while it loads; the next
 * mount's addFilter puts in a new search filter, which the watcher reloads
 * page 1 on even when the search is the same (ADR-0029)
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
onUnmounted(() => {
	dataList.value = [];
});

/**
 * @author Oleksandr Palonnyi
 * wt-table paints its active row itself (ui-sdk >= 26.12.26), so the selected
 * row needs no token or class of the table's own, see ADR-0027
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
const selectedRow = computed(
	() => dataList.value.find((row) => row.id === selectedRowId.value) ?? null,
);

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
</style>
