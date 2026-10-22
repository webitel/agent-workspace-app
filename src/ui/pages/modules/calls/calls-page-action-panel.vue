<template>
	<table-action-panel>
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
import type { useMissedCallsDataListStore } from './modules/missed/store/missed-calls';
import type { useOfflineCallsDataListStore } from './modules/offline/store/offline-calls';

const props = defineProps<{
	store:
		| ReturnType<typeof useMissedCallsDataListStore>
		| ReturnType<typeof useOfflineCallsDataListStore>;
}>();

const { filtersManager, isFiltersRestoring } = storeToRefs(props.store);
const { addFilter, updateFilter, deleteFilter } = props.store;
</script>