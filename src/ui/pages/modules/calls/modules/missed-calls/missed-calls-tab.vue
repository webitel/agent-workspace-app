<template>
	<div
		v-show="dataList.length"
		class="missed-calls-tab table-wrapper"
	>
		<wt-table
			class="missed-calls-tab__table"
			:data="dataList"
			:headers="shownHeaders"
			:on-loading="onLoading"
			data-key="id"
			lazy
			reorderable-columns
			resizable-columns
			sortable
			@sort="updateSort"
		>
			<template #name="{ item }">
				<div
					class="missed-calls-tab__name-cell"
					@click="openContactCard(item)"
				>
					<wt-avatar
						:username="item.name"
						size="sm"
					/>
					{{ item.name }}
				</div>
			</template>

			<template #createdAt="{ item }">
				<wt-datetime-text :datetime="item.createdAt" />
			</template>

			<template #duration="{ item }">
				{{ convertDuration(item.duration) }}
			</template>

			<template #actions="{ item }">
				<wt-icon-btn
					v-tooltip="t('ui.pages.calls.missed.actions.openContact')"
					icon="arrow-right"
					@click="openContactCard(item)"
				/>

				<wt-icon-btn
					v-tooltip="t('ui.pages.calls.missed.actions.call')"
					icon="call"
					@click="redialMissedCall(item.id)"
				/>
			</template>
		</wt-table>
	</div>
</template>

<script setup lang="ts">
import {
	WtAvatar,
	WtDatetimeText,
	WtIconBtn,
	WtTable,
} from '@webitel/ui-sdk/components';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { redialMissedCall } from './api/missedCallsAPI';
import { useMissedCallsStore } from './store/missedCalls';
import type { MissedCallRow } from './types/MissedCall.types';

const { t } = useI18n();

const tableStore = useMissedCallsStore();
const { initialize, appendToDataList, updateSort } = tableStore;
const { dataList, shownHeaders, next } = storeToRefs(tableStore);

const isFirstLoad = ref(false);
const isInitializing = ref(true);

const onLoading = async () => {
	if (isInitializing.value) return;
	if (!next.value && isFirstLoad.value) return;
	await appendToDataList();
	isFirstLoad.value = true;
};

function openContactCard(row: MissedCallRow) {
	console.warn(
		'[missed-calls] contact card (E7) is not implemented yet',
		row.contactId,
	);
}

initialize().finally(() => {
	isInitializing.value = false;
});
</script>

<style scoped>
.missed-calls-tab {
	width: 100%;
}

.missed-calls-tab__table {
	flex: 1;
	min-height: 0;
}

.missed-calls-tab__name-cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	border: none;
	background: none;
	cursor: pointer;
	padding: 0;
	text-align: left;
}
</style>
