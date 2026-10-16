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
				<username-table-cell :name="getName(item)" />
			</template>

			<template #createdAt="{ item }">
				{{ formatCreatedAt(item.createdAt) }}
			</template>

			<template #duration="{ item }">
				{{ formatDuration(item.duration) }}
			</template>

			<template #queue="{ item }">
				{{ item.queue?.name || '–' }}
			</template>

			<template #phone="{ item }">
				<phone-call-table-cell :phone-number="item.from?.number" />
			</template>
		</wt-table>
	</div>
</template>

<script setup lang="ts">
import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { WtTable } from '@webitel/ui-sdk/components';
import { FormatDateMode } from '@webitel/ui-sdk/enums';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { formatDate } from '@webitel/ui-sdk/utils';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import PhoneCallTableCell from '../../../../components/phone-call-table-cell.vue';
import UsernameTableCell from '../../../../components/username-table-cell.vue';
import { useMissedCallsDataListStore } from './store/missed-calls';

const store = useMissedCallsDataListStore();

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

const getName = ({ contact, from }: EngineHistoryCall) =>
	contact?.name || from?.name || from?.number;

const formatCreatedAt = (createdAt?: string) =>
	createdAt ? formatDate(+createdAt, FormatDateMode.DATETIME) : '';

const formatDuration = (duration?: number) =>
	convertDuration(duration ?? 0).replaceAll(':', '.');

initialize().finally(() => {
	isInitializing.value = false;
});
</script>
