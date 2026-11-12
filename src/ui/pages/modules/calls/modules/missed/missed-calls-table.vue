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
				<username-table-cell
					:name="getName(item)"
					clickable
					@click="openContact(item)"
				/>
			</template>

			<template #createdAt="{ item }">
				{{ formatDate(item.createdAt, FormatDateMode.DATETIME) }}
			</template>

			<template #duration="{ item }">
				{{ convertDuration(item.duration) }}
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
import { useSidebarSelectionStore } from '../../../../../sidebar/store/sidebar-selection';
import PhoneCallTableCell from '../../../../components/phone-call-table-cell.vue';
import UsernameTableCell from '../../../../components/username-table-cell.vue';
import { getCallPhoneNumber } from '../../../history/modules/calls/scripts/getCallPhoneNumber';
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

const { selectContact, selectPhoneNumber } = useSidebarSelectionStore();

const isInitializing = ref(true);

const onLoading = async () => {
	if (isInitializing.value || isLoading.value || !next.value) return;
	await appendToDataList();
};

const getName = ({ contact, from }: EngineHistoryCall) =>
	contact?.name || from?.name || from?.number;

/**
 * The linked contact if there is one; a missed call rarely has it (nobody
 * answered to link one), so otherwise the panel searches by the call's number.
 * A hidden number is not searched: the panel shows an unknown contact
 * [WS-33](https://webitel.atlassian.net/browse/WS-33)
 */
const openContact = (call: EngineHistoryCall) => {
	if (call.contact?.id) {
		selectContact(String(call.contact.id));
		return;
	}
	selectPhoneNumber(call.hideNumber ? undefined : getCallPhoneNumber(call));
};

initialize().finally(() => {
	isInitializing.value = false;
});
</script>
