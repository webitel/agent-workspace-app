<template>
	<table-action-panel
		:actions="actions"
		:headers="headers"
		:static-headers="staticHeaders"
		:variables-storage-key="CALLS_VARIABLE_HEADERS_STORAGE_KEY"
		@refresh="refresh"
		@update:headers="updateShownHeaders"
	>
		<dynamic-filter-search
			:filters-manager="filtersManager"
			:is-filters-restoring="isFiltersRestoring"
			@filter:add="addFilter"
			@filter:update="updateFilter"
			@filter:delete="deleteFilter"
		/>
	</table-action-panel>
</template>

<script setup lang="ts">
import { DynamicFilterSearchComponent as DynamicFilterSearch } from '@webitel/ui-datalist/filters';
import { storeToRefs } from 'pinia';
import TableActionPanel from '../../components/table-action-panel.vue';
import { TableActionPanelAction } from '../../enums/TableActionPanelAction.enum';
import { CALLS_VARIABLE_HEADERS_STORAGE_KEY } from './constants/storageKeys';
import type { useCallsHistoryDataListStore } from './modules/calls/store/calls-history';

const props = defineProps<{
	store: ReturnType<typeof useCallsHistoryDataListStore>;
}>();

const actions = [
	TableActionPanelAction.ColumnSelect,
	TableActionPanelAction.VariableColumnSelect,
	TableActionPanelAction.Refresh,
];

const staticHeaders = [
	'createdAt',
];

const { headers, filtersManager, isFiltersRestoring } = storeToRefs(
	props.store,
);
const {
	addFilter,
	updateFilter,
	deleteFilter,
	updateShownHeaders,
	loadDataList,
	updatePage,
} = props.store;

const refresh = () => {
	updatePage(1);
	loadDataList();
};
</script>