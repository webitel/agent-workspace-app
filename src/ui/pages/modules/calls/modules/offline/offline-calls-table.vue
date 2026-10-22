<template>
	<div class="table-section__table-wrapper">
		<wt-table
			:data="dataList"
			:headers="shownHeaders"
			:lazy="true"
			:selectable="false"
			:grid-actions="false"
			:on-loading="onLoading"
			data-key="id"
			sortable
			resizable-columns
			reorderable-columns
			@sort="(column, order) => updateSort(column, order)"
			@column-resize="columnResize"
			@column-reorder="columnReorder"
		>
			<template #name="{ item }">
				<username-table-cell :name="item.name" />
			</template>

			<template #queue="{ item }">
				{{ item.queue?.name || '–' }}
			</template>

			<template #phone="{ item }">
				{{ item.communications[0]?.destination }}
			</template>
		</wt-table>
	</div>
</template>

<script setup lang="ts">
import { WtTable } from '@webitel/ui-sdk/components';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import UsernameTableCell from '../../../../components/username-table-cell.vue';
import { useOfflineCallsAutoRefresh } from './composables/useOfflineCallsAutoRefresh';
import { useOfflineCallsDataListStore } from './store/offline-calls';

const store = useOfflineCallsDataListStore();

const {
	initialize,
	appendToDataList,
	updateSort,
	columnResize,
	columnReorder,
} = store;
const { dataList, shownHeaders, next, isLoading } = storeToRefs(store);

const isInitializing = ref(true);

const onLoading = async () => {
	if (isInitializing.value || isLoading.value || !next.value) return;
	await appendToDataList();
};

initialize().finally(() => {
	isInitializing.value = false;
});

useOfflineCallsAutoRefresh(store);
</script>
