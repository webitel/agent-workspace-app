<template>
	<div class="chats-active-table">
		<wt-table
			:data="dataList"
			:headers="shownHeaders"
			:lazy="true"
			:selected="selected"
			:on-loading="onLoading"
			data-key="id"
			sortable
			fixed-actions
			resizable-columns
			reorderable-columns
			@sort="(column, order) => updateSort(column, order)"
			@column-resize="columnResize"
			@column-reorder="columnReorder"
			@update:selected="updateSelected"
		>
			<template #name="{ item }">
				<username-table-cell :name="item.name" />
			</template>

			<template #startedAt="{ item }">
				{{ formatDate(item.startedAt, FormatDateMode.DATETIME) }}
			</template>

			<template #duration="{ item }">
				{{ convertDuration(item.duration) }}
			</template>

			<template #actions>
				<wt-icon-btn
					icon="ws-chat"
					:size="ComponentSize.SM"
					color="chat"
				/>
			</template>
		</wt-table>
	</div>
</template>

<script setup lang="ts">
import { WtTable } from '@webitel/ui-sdk/components';
import { ComponentSize, FormatDateMode } from '@webitel/ui-sdk/enums';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { formatDate } from '@webitel/ui-sdk/utils';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import UsernameTableCell from '../../../../components/username-table-cell.vue';
import { useActiveChatsDataListStore } from './store/active-chats';

const store = useActiveChatsDataListStore();

const {
	initialize,
	appendToDataList,
	updateSort,
	updateSelected,
	columnResize,
	columnReorder,
} = store;
const { dataList, selected, shownHeaders, next, isLoading } =
	storeToRefs(store);

const isInitializing = ref(true);

const onLoading = async () => {
	if (isInitializing.value || isLoading.value || !next.value) return;
	await appendToDataList();
};

initialize().finally(() => {
	isInitializing.value = false;
});
</script>

<style scoped>
.wt-icon-btn {
	padding: var(--spacing-xs);
}
</style>
