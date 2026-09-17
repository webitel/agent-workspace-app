<template>
	<ws-table-toolbar
		search
		:search-value="searchValue"
		:headers="headers"
		:actions="['refresh', 'columnSelect']"
		@update:search-value="searchValue = $event"
		@search="handleSearch"
		@refresh="loadDataList()"
		@update:headers="updateShownHeaders"
	/>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import WsTableToolbar from '../../../../components/ws-table-toolbar.vue';
import { useContactsDataListStore } from './store/contacts';

const tableStore = useContactsDataListStore();
const {
	loadDataList,
	hasFilter,
	addFilter,
	updateFilter,
	deleteFilter,
	updateShownHeaders,
} = tableStore;
const { headers } = storeToRefs(tableStore);

const searchValue = ref('');

const handleSearch = (value: string) => {
	if (!value) {
		if (hasFilter('search'))
			deleteFilter({
				name: 'search',
			});
		return;
	}
	hasFilter('search')
		? updateFilter({
				name: 'search',
				value,
			})
		: addFilter({
				name: 'search',
				value,
			});
};
</script>
