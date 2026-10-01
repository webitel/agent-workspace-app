<template>
	<table-action-panel
		:headers="shownHeaders"
		@refresh="loadDataList()"
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
import type { useCallsHistoryDataListStore } from './modules/calls/store/calls-history';

const props = defineProps<{
	store: ReturnType<typeof useCallsHistoryDataListStore>;
}>();

const { shownHeaders, filtersManager, isFiltersRestoring } = storeToRefs(
	props.store,
);
const {
	addFilter,
	updateFilter,
	deleteFilter,
	updateShownHeaders,
	loadDataList,
} = props.store;
</script>