<template>
	<div
		ref="tableWrapper"
		class="table-section__table-wrapper"
	>
		<wt-table
			:data="dataList"
			:headers="shownHeaders"
			:lazy="true"
			:selectable="false"
			:on-loading="onLoading"
			data-key="id"
			fixed-actions
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

			<template
				v-for="header in variableHeaders"
				:key="header.value"
				#[header.value]="slotProps"
			>
				{{ getVariableValue(slotProps, header.value) }}
			</template>

			<template #column-filter="scope">
				<column-filter
					v-bind="scope"
					:filters-manager="filtersManager"
					@add:filter="addFilter"
					@update:filter="updateFilter"
					@delete:filter="deleteFilter"
				/>
			</template>

			<template #actions="{ item }">
				<calls-history-row-actions
					:item="item"
					@play="play"
					@show-info="openCallInfo"
				/>
			</template>

			<template #empty>
				<wt-empty
					:image="emptyImage"
					:text="t('ui.reusable.nothingToShowHere')"
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

	<calls-history-info-popup
		v-if="callInfoItem"
		:item="callInfoItem"
		@close="closeCallInfo"
	/>
</template>

<script setup lang="ts">
import { useElementBounding, useWindowSize } from '@vueuse/core';
import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { ColumnFilterComponent as ColumnFilter } from '@webitel/ui-datalist/filters';
import { WtPlayer, WtTable } from '@webitel/ui-sdk/components';
import { ComponentSize, FormatDateMode } from '@webitel/ui-sdk/enums';
import {
	isVariableHeader,
	VARIABLE_FIELD_PREFIX,
} from '@webitel/ui-sdk/modules/TableVariableColumnSelect';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import emptyTableDark from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-table-dark.svg';
import emptyTableLight from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-table-light.svg';
import { formatDate } from '@webitel/ui-sdk/utils';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useThemedImage } from '../../../../../../app/composables/useThemedImage';
import CallsHistoryInfoPopup from './calls-history-info-popup.vue';
import CallsHistoryNameCell from './calls-history-name-cell.vue';
import CallsHistoryPhoneCell from './calls-history-phone-cell.vue';
import CallsHistoryRowActions from './calls-history-row-actions.vue';
import { usePlayCallRecording } from './composables/usePlayCallRecording';
import { useCallsHistoryDataListStore } from './store/calls-history';

const { t } = useI18n();

const store = useCallsHistoryDataListStore();

const {
	initialize,
	appendToDataList,
	columnResize,
	columnReorder,
	addFilter,
	updateFilter,
	deleteFilter,
} = store;
const { dataList, shownHeaders, next, isLoading, filtersManager } =
	storeToRefs(store);

const { playingFile, playingSrc, isAudioOpen, isVideoOpen, play, close } =
	usePlayCallRecording();

const emptyImage = useThemedImage({
	light: emptyTableLight,
	dark: emptyTableDark,
});

const tableWrapper = ref<HTMLElement>();
const callInfoItem = ref<EngineHistoryCall | null>(null);
const isInitializing = ref(true);

// audio player is rendered in <body> (outside the table DOM, so it can't trigger
// table recalculation and extra page loads) and positioned over the table bottom
const { left, width, bottom } = useElementBounding(tableWrapper);
const { height: windowHeight } = useWindowSize();

const playerStyle = computed(() => ({
	left: `${left.value}px`,
	width: `${width.value}px`,
	bottom: `${windowHeight.value - bottom.value}px`,
}));

const variableHeaders = computed(() =>
	shownHeaders.value.filter(isVariableHeader),
);

const onLoading = async () => {
	if (isInitializing.value || isLoading.value || !next.value) return;
	await appendToDataList();
};

const formatCreatedAt = (createdAt?: string) =>
	createdAt ? formatDate(+createdAt, FormatDateMode.DATETIME) : '';

const formatDuration = (duration?: number) =>
	convertDuration(duration ?? 0).replaceAll(':', '.');

const openCallInfo = (item: EngineHistoryCall) => {
	callInfoItem.value = item;
};

const closeCallInfo = () => {
	callInfoItem.value = null;
};

// dynamic slot names are untyped in vue-tsc: slot props come as `{}`
const getVariableValue = (slotProps: unknown, headerValue: string) => {
	const { item } = slotProps as {
		item?: EngineHistoryCall;
	};
	return item?.variables?.[headerValue?.slice(VARIABLE_FIELD_PREFIX.length)];
};

initialize().finally(() => {
	isInitializing.value = false;
});
</script>
