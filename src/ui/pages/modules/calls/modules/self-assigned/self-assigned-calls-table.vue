<template>
	<div class="table-section__table-wrapper">
		<wt-table
			:data="dataList"
			:headers="shownHeaders"
			:lazy="true"
			:selectable="false"
			:grid-actions="false"
			:on-loading="onLoading"
			data-key="attemptId"
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

			<template #joinedAt="{ item }">
				{{ formatDate(item.joinedAt, FormatDateMode.DATETIME) }}
			</template>

			<template #wait="{ item }">
				{{ convertDuration(item.wait) }}
			</template>

			<template #queue="{ item }">
				{{ getQueueName(item) || '–' }}
			</template>

			<template #phone="{ item }">
				<phone-call-table-cell :phone-number="item.displayNumber" />
			</template>
		</wt-table>
	</div>
</template>

<script setup lang="ts">
import { WtTable } from '@webitel/ui-sdk/components';
import { FormatDateMode } from '@webitel/ui-sdk/enums';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { formatDate } from '@webitel/ui-sdk/utils';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import type { WaitingMemberCall } from 'webitel-sdk';
import { useWebSocketClient } from '../../../../../../app/api/socket/composables/useWebSocketClient';
import { useSidebarSelectionStore } from '../../../../../sidebar/store/sidebar-selection';
import PhoneCallTableCell from '../../../../components/phone-call-table-cell.vue';
import UsernameTableCell from '../../../../components/username-table-cell.vue';
import { useSelfAssignedCallsDataListStore } from './store/self-assigned-calls';

const store = useSelfAssignedCallsDataListStore();

const { initialize, loadDataList, updateSort, columnResize, columnReorder } =
	store;
const { dataList, shownHeaders } = storeToRefs(store);

const { agent } = useWebSocketClient();
const { selectContact, selectUnknownContact } = useSidebarSelectionStore();

const isInitializing = ref(true);

const onLoading = async () => {
	if (isInitializing.value || !agent.value?.hasMoreWaitingCalls) return;
	agent.value.loadMoreWaitingCalls();
};

const getName = ({ contact, displayName, displayNumber }: WaitingMemberCall) =>
	contact?.name || displayName || displayNumber;

// the SDK types `queue` as a bare object
type WaitingCallQueue = {
	name?: string;
};

const getQueueName = ({ queue }: WaitingMemberCall) =>
	(queue as WaitingCallQueue).name;

const openContact = ({ contact }: WaitingMemberCall) => {
	if (!contact?.id) {
		selectUnknownContact();
		return;
	}
	selectContact(String(contact.id));
};

// the agent session may load after the table, or change on re-login:
// the store has to take the list of the current agent
watch(agent, (value) => {
	if (value) loadDataList();
});

initialize().finally(() => {
	isInitializing.value = false;
});
</script>
