<template>
	<wt-table
		class="transfer-agents-table"
		:data="dataList"
		:headers="shownHeaders"
		:active-row="activeRow"
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
			<div class="transfer-agents-table__cell">
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
import { storeToRefs } from 'pinia';
import { computed, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UsernameTableCell from '../../../../pages/components/username-table-cell.vue';
import { TRANSFER_AGENT_BADGE_COLOR_VARIABLES } from '../mappings/transferAgentStatusColors';
import { TRANSFER_AGENT_STATUS_LABEL_KEYS } from '../mappings/transferAgentStatusLabelKeys';
import type { TransferAgentStatus } from '../enums/TransferAgentStatus.enum';
import { useTransferAgentsDataListStore } from '../store/transferAgentsDataList';
import type { TransferAgentRow } from '../types/CallTransfer.types';

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

const activeRow = computed(
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

.transfer-agents-table :deep(tbody tr) {
	cursor: pointer;
}
</style>
