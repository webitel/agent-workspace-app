<template>
	<div
		ref="tableWrapper"
		v-show="dataList.length"
		class="table-section__table-wrapper"
	>
		<wt-table
			:data="dataList"
			:headers="shownHeaders"
			:lazy="true"
			:selectable="false"
			:on-loading="onLoading"
			data-key="id"
			resizable-columns
			reorderable-columns
			@column-resize="columnResize"
			@column-reorder="columnReorder"
		>
			<template #name="{ item }">
				<calls-history-name-cell :item="item" />
			</template>

			<template #createdAt="{ item }">
				{{ formatCreatedAt(item.createdAt) }}
			</template>

			<template #duration="{ item }">
				{{ formatDuration(item.duration) }}
			</template>

			<template #phone="{ item }">
				<calls-history-phone-cell :item="item" />
			</template>

			<template #metrics="{ item }">
				<wt-call-media-metric
					v-if="item.qualityMetrics"
					show-tooltip
					:mos-avg="item.qualityMetrics.mosAvg"
					:size="ComponentSize.SM"
					tooltip-text-prefix="calls.connectionQuality"
				/>
			</template>
			
			<template #actions="{ item }">
				<calls-history-row-actions
					:item="item"
					@play="play"
				/>
			</template>
		</wt-table>

		<wt-vidstack-player
			v-if="isVideoOpen"
			:src="playingSrc"
			:title="playingFile?.name"
			:size="ComponentSize.MD"
			closable
			@close="close"
		/>
	</div>

	<teleport to="body">
		<wt-player
			v-if="isAudioOpen"
			:id="playingFile?.id"
			:src="playingSrc"
			:style="playerStyle"
			position="fixed"
			@close="close"
		/>
	</teleport>
</template>

<script setup lang="ts">
import { useElementBounding, useWindowSize } from '@vueuse/core';
import { WtTable } from '@webitel/ui-sdk/components';
import { ComponentSize, FormatDateMode } from '@webitel/ui-sdk/enums';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { formatDate } from '@webitel/ui-sdk/utils';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import CallsHistoryNameCell from './calls-history-name-cell.vue';
import CallsHistoryPhoneCell from './calls-history-phone-cell.vue';
import CallsHistoryRowActions from './calls-history-row-actions.vue';
import { usePlayCallRecording } from './composables/usePlayCallRecording';
import type { useCallsHistoryDataListStore } from './store/calls-history';

const props = defineProps<{
	store: ReturnType<typeof useCallsHistoryDataListStore>;
}>();

const { initialize, appendToDataList, columnResize, columnReorder } =
	props.store;
const { dataList, shownHeaders, next, isLoading } = storeToRefs(props.store);

const { playingFile, playingSrc, isAudioOpen, isVideoOpen, play, close } =
	usePlayCallRecording();

const tableWrapper = ref<HTMLElement>();

// audio player is rendered in <body> (outside the table DOM, so it can't trigger
// table recalculation and extra page loads) and positioned over the table bottom
const { left, width, bottom } = useElementBounding(tableWrapper);
const { height: windowHeight } = useWindowSize();

const playerStyle = computed(() => ({
	left: `${left.value}px`,
	width: `${width.value}px`,
	bottom: `${windowHeight.value - bottom.value}px`,
}));

const isInitializing = ref(true);

const onLoading = async () => {
	if (isInitializing.value || isLoading.value || !next.value) return;
	await appendToDataList();
};

const formatCreatedAt = (createdAt?: string) =>
	createdAt ? formatDate(+createdAt, FormatDateMode.DATETIME) : '';

const formatDuration = (duration?: number) =>
	convertDuration(duration ?? 0).replaceAll(':', '.');

initialize().finally(() => {
	isInitializing.value = false;
});
</script>
