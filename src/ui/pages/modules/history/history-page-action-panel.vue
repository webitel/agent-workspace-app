<template>
	<table-action-panel
		:headers="shownHeaders"
		@refresh="loadDataList()"
		@update:headers="updateShownHeaders"
	/>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import TableActionPanel from '../../components/table-action-panel.vue';
import type { useCallsHistoryDataListStore } from './modules/calls/store/calls-history';

const props = defineProps<{
	store: ReturnType<typeof useCallsHistoryDataListStore>;
}>();

const { shownHeaders } = storeToRefs(props.store);
const { updateShownHeaders, loadDataList } = props.store;
</script>
