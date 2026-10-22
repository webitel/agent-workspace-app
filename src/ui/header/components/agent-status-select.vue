<template>
	<wt-cc-agent-status-select
		class="agent-status-select"
		:agent-id="agentId"
		:status="status"
		:status-duration="statusDuration"
		:disabled="isDisabled"
	/>
</template>

<script setup lang="ts">
import { WtCcAgentStatusSelect } from '@webitel/ui-sdk/modules/AgentStatusSelect';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import { WebSocketConnectionState } from '../../../app/api/socket/enums/WebSocketConnectionState.enum';
import { useAgentStore } from '../../../features/agent/store/agent';
import { useElapsedSec } from '../../composables/useElapsedSec';

const { agentId, status, lastStatusChange } = storeToRefs(useAgentStore());
const { state: socketState } = useWebSocketClient();

/*
 * `Agent.stateDuration` exists but is a plain getter, so it never re-renders;
 * the elapsed time has to come from a ticking clock instead.
 */
const statusElapsedSec = useElapsedSec(lastStatusChange);

const statusDuration = computed(() => convertDuration(statusElapsedSec.value));

const isDisabled = computed(
	() =>
		socketState.value !== WebSocketConnectionState.Connected || !agentId.value,
);
</script>
