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
					:name="item.name"
					clickable
					@click="openMember(item)"
				/>
			</template>

			<template #queue="{ item }">
				{{ item.queue?.name || '–' }}
			</template>

			<template #phone="{ item }">
				<offline-member-phones-cell
					:communications="item.communications"
					:loading="callingMemberId === item.id"
					@call="(communication) => callMember(item, communication)"
				/>
			</template>
		</wt-table>
	</div>
</template>

<script setup lang="ts">
import { WtTable } from '@webitel/ui-sdk/components';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useSidebarSelectionStore } from '../../../../../sidebar/store/sidebar-selection';
import UsernameTableCell from '../../../../components/username-table-cell.vue';
import { callOfflineMember } from './api/callOfflineMember';
import OfflineMemberPhonesCell from './components/offline-member-phones-cell.vue';
import { useOfflineCallsDataListStore } from './store/offline-calls';
import type {
	OfflineMember,
	OfflineMemberCommunication,
} from './types/OfflineMember.types';

const store = useOfflineCallsDataListStore();

const {
	initialize,
	loadDataList,
	appendToDataList,
	updatePage,
	updateSort,
	columnResize,
	columnReorder,
} = store;
const { dataList, shownHeaders, next, isLoading } = storeToRefs(store);

const { selectPhoneNumber } = useSidebarSelectionStore();

const isInitializing = ref(true);

const onLoading = async () => {
	if (isInitializing.value || isLoading.value || !next.value) return;
	await appendToDataList();
};

const openMember = ({ communications }: OfflineMember) => {
	selectPhoneNumber(communications[0]?.destination);
};

const callingMemberId = ref<number | null>(null);

/**
 * As cc-workspaces: one request at a time per member, the list reloaded from
 * its first page once the queue has taken the call (the member has left the
 * offline queue), and a refused request left without a notification or a reload
 * [WS-30](https://webitel.atlassian.net/browse/WS-30)
 */
const callMember = async (
	member: OfflineMember,
	communication: OfflineMemberCommunication,
) => {
	if (callingMemberId.value === member.id) return;
	callingMemberId.value = member.id;

	try {
		await callOfflineMember(member.id, communication.id);
		updatePage(1);
		await loadDataList();
	} catch (err) {
		console.error('[calls] calling an offline member failed', err);
	} finally {
		callingMemberId.value = null;
	}
};

initialize().finally(() => {
	isInitializing.value = false;
});
</script>
