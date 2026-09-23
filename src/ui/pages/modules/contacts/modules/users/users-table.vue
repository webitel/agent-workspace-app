<template>
	<div
		v-show="dataList.length"
		class="users-table table-wrapper"
	>
		<wt-table
			:data="dataList"
			:headers="shownHeaders"
			:lazy="true"
			:selectable="false"
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

			<template #presence="{ item }">
				<wt-indicator v-bind="getStatus(item)" />
			</template>

			<!-- TODO: uncomment together with the team header when UsersAPI starts returning team -->
			<!-- <template #team="{ item }">
				{{ item.team?.name }}
			</template> -->

			<template #extension="{ item }">
				<table-cell-info
					icon="call--filled"
					:icon-color="IconColor.SUCCESS"
					:items="item.extension ? [item.extension] : []"
				/>
			</template>
		</wt-table>
	</div>
</template>

<script setup lang="ts">
import type { ApiUser } from '@webitel/api-services/gen/models';
import { WtTable } from '@webitel/ui-sdk/components';
import {
	AbstractUserStatusColorMappings,
	IconColor,
} from '@webitel/ui-sdk/enums';
import { getUserStatusByPriority } from '@webitel/ui-sdk/scripts';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import TableCellInfo from '../../../../../components/table-cell-info.vue';
import UsernameTableCell from '../../../../../components/username-table-cell.vue';
import type { useUsersDataListStore } from './store/users';

const props = defineProps<{
	store: ReturnType<typeof useUsersDataListStore>;
}>();

const {
	initialize,
	appendToDataList,
	updateSort,
	columnResize,
	columnReorder,
} = props.store;
const { dataList, shownHeaders, next } = storeToRefs(props.store);

const isFirstLoad = ref(false);
const isInitializing = ref(true);

const onLoading = async () => {
	if (isInitializing.value) return;
	if (!next.value && isFirstLoad.value) return;
	await appendToDataList();
	isFirstLoad.value = true;
};

function getStatus(item: ApiUser) {
	const status = getUserStatusByPriority({
		presence: item.presence,
	});

	return {
		color: AbstractUserStatusColorMappings[status],
		text: status.toUpperCase(),
	};
}

initialize().finally(() => {
	isInitializing.value = false;
});
</script>

<style scoped>
.users-table {
	width: 100%;
}
</style>
