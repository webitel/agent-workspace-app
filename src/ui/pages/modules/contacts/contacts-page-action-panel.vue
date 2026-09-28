<template>
	<table-action-panel
		is-search
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
import TableActionPanel from '../../components/table-action-panel.vue';
import type { useContactsDataListStore } from './modules/contacts/store/contacts';
import type { useUsersDataListStore } from './modules/users/store/users';

const props = defineProps<{
	store:
		| ReturnType<typeof useContactsDataListStore>
		| ReturnType<typeof useUsersDataListStore>;
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
