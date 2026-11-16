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
				<self-assigned-call-phone-cell
					:phone-number="item.displayNumber"
					:loading="interceptingAttemptIds.has(item.attemptId)"
					@answer="answer(item)"
				/>
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
import { reactive, ref, watch } from 'vue';
import type { WaitingMemberCall } from 'webitel-sdk';
import { useWebSocketClient } from '../../../../../../app/api/socket/composables/useWebSocketClient';
import { useCallsStore } from '../../../../../../features/calls/store/calls';
import { useSidebarSelectionStore } from '../../../../../sidebar/store/sidebar-selection';
import UsernameTableCell from '../../../../components/username-table-cell.vue';
import SelfAssignedCallPhoneCell from './components/self-assigned-call-phone-cell.vue';
import { useSelfAssignedCallsDataListStore } from './store/self-assigned-calls';

const store = useSelfAssignedCallsDataListStore();

const { initialize, loadDataList, updateSort, columnResize, columnReorder } =
	store;
const { dataList, shownHeaders } = storeToRefs(store);

const { agent } = useWebSocketClient();
const { selectContact, selectPhoneNumber } = useSidebarSelectionStore();

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

/**
 * The linked contact if there is one, otherwise the panel searches the
 * contacts by the call's number, as a ringing call's are identified (ADR-0015)
 * [WS-39](https://webitel.atlassian.net/browse/WS-39)
 */
const openContact = ({ contact, displayNumber }: WaitingMemberCall) => {
	if (contact?.id) {
		selectContact(String(contact.id));
		return;
	}
	selectPhoneNumber(displayNumber || undefined);
};

const { holdOtherLiveCalls } = useCallsStore();

const interceptingAttemptIds = reactive(new Set<number>());

/**
 * Takes the call from its queue for this agent (AC_12.03.02), as cc-workspaces
 * does: not a manual dial, the client's own waiting call is the one answered.
 * Nothing answers it here: the platform sends it with `autoAnswer` and the SDK
 * answers it by itself, past `callsStore.answer`, so the other live calls are
 * put on hold first. One request at a time per call, with its loader. The row
 * leaves by itself (the SDK drops the attempt from the list over the socket),
 * so nothing is reloaded; the agent stays on the tab and the call shows in the
 * dock. A refused intercept (another agent was faster, the deadline passed) is
 * only logged (ADR-0015)
 * [WS-39](https://webitel.atlassian.net/browse/WS-39)
 */
const answer = async ({ attemptId }: WaitingMemberCall) => {
	// no agent session: there is no queue to ask
	if (!agent.value || interceptingAttemptIds.has(attemptId)) return;
	interceptingAttemptIds.add(attemptId);

	try {
		await holdOtherLiveCalls();
		await agent.value.interceptAttempt(attemptId);
	} catch (err) {
		console.error('[calls] intercepting a self-assigned call failed', err);
	} finally {
		interceptingAttemptIds.delete(attemptId);
	}
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
