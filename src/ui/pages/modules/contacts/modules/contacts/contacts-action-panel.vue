<template>
	<ws-table-action-panel
		search
		:search-value="searchValue"
		:headers="shownHeaders"
		@update:search-value="handleSearch"
		@refresh="loadDataList()"
		@update:headers="updateShownHeaders"
	/>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import WsTableActionPanel from '../../../../components/ws-table-action-panel.vue';
import type { useContactsDataListStore } from './store/contacts';

const props = defineProps<{
	store: ReturnType<typeof useContactsDataListStore>;
}>();

const { shownHeaders } = storeToRefs(props.store);
const {
	hasFilter,
	addFilter,
	updateFilter,
	deleteFilter,
	updateShownHeaders,
	loadDataList,
} = props.store;

const searchValue = ref('');

const handleSearch = (value: string) => {
	searchValue.value = value;

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
