<template>
	<div class="agent-status-select">
		<wt-status-select
			:status="status"
			:status-duration="statusDuration"
			:disabled="isDisabled"
			@change="handleStatusChange"
		/>
		<wt-cc-activity-type-popup
			v-if="isActivityTypePopup"
			:options="activityTypes"
			@change="handleActivityType"
			@close="isActivityTypePopup = false"
		/>
		<wt-cc-pause-cause-popup
			v-if="isPauseCausePopup"
			:options="pauseCauses"
			@change="handlePauseCause"
			@close="isPauseCausePopup = false"
		/>
		<wt-cc-status-select-error-popup
			v-if="error"
			:error="error"
			@close="error = null"
		/>
	</div>
</template>

<script setup lang="ts">
import { useNow } from '@vueuse/core';
import { WtStatusSelect } from '@webitel/ui-sdk/components';
import { AgentStatus } from '@webitel/ui-sdk/enums';
import {
	PauseCauseAPI,
	useActivityTypesOptions,
	WtCcActivityTypePopup,
	WtCcPauseCausePopup,
	WtCcStatusSelectErrorPopup,
} from '@webitel/ui-sdk/modules/AgentStatusSelect';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import { WebSocketConnectionState } from '../../../app/api/socket/enums/WebSocketConnectionState.enum';
import type { ActivityType } from '../../../features/agent/store/agent';
import { useAgentStore } from '../../../features/agent/store/agent';

const agentStore = useAgentStore();
const { agentId, status, lastStatusChange, isAgentRemoved } =
	storeToRefs(agentStore);
const { setAgentWaitingStatus, setAgentPauseStatus, setAgentOfflineStatus } =
	agentStore;

const { state: socketState } = useWebSocketClient();
const { activityTypes, loadActivityTypes } = useActivityTypesOptions();

const now = useNow({
	interval: 1000,
});

const isActivityTypePopup = ref(false);
const isPauseCausePopup = ref(false);
const pauseCauses = ref([]);
const error = ref(null);

const statusDuration = computed(() => {
	const elapsed = now.value.getTime() - (lastStatusChange.value ?? Date.now());
	return convertDuration(Math.max(elapsed, 0) / 1000);
});

const isDisabled = computed(
	() =>
		socketState.value !== WebSocketConnectionState.Connected ||
		!agentId.value ||
		isAgentRemoved.value,
);

async function goOnline(activityType?: ActivityType) {
	await setAgentWaitingStatus(activityType);
}

async function pause(pauseCause?: { cause?: string; comment?: string }) {
	const notAllowed = await setAgentPauseStatus(pauseCause);
	if (notAllowed) error.value = notAllowed;
}

async function handleStatusChange(next: string) {
	if (next === AgentStatus.ONLINE) {
		await loadActivityTypes();
		if (activityTypes.value.length > 1) {
			isActivityTypePopup.value = true;
			return;
		}
		return goOnline();
	}

	if (next === AgentStatus.PAUSE) {
		const { items } = await PauseCauseAPI.getList({
			agentId: agentId.value,
		});
		pauseCauses.value = items;
		if (items.length) {
			isPauseCausePopup.value = true;
			return;
		}
		return pause();
	}

	return setAgentOfflineStatus();
}

function handleActivityType(activityType: ActivityType) {
	isActivityTypePopup.value = false;
	return goOnline(activityType);
}

function handlePauseCause({
	pauseCause,
	statusComment,
}: {
	pauseCause: string;
	statusComment: string;
}) {
	isPauseCausePopup.value = false;
	return pause({
		cause: pauseCause,
		comment: statusComment,
	});
}
</script>

<style scoped>
.agent-status-select {
	width: 150px;
}
</style>
