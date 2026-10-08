<template>
	<!-- keyed by chat: the table's sort must not follow the agent into another -->
	<variables-table
		:key="threadId"
		class="chat-info"
		:rows="rows"
		:is-pending="!variablesStore.isLoaded"
		:is-loading="variablesStore.isLoading"
		:error="variablesStore.error"
		@retry="variablesStore.refresh()"
	/>
</template>

<script setup lang="ts">
import { computed, onActivated } from 'vue';
import type { Task } from 'webitel-sdk';

import VariablesTable from '../../../variables/components/variables-table.vue';
import { toInfoRows } from '../../scripts/toInfoRows';
import { useChatVariablesStore } from '../../store/chat-variables';

const props = defineProps<{
	/** the chat's call-center task; absent once the task has left the feed */
	task?: Task;
	threadId: string;
}>();

// Resolved reactively: the chat window reuses this instance across chats.
const variablesStore = computed(() => useChatVariablesStore(props.threadId));

const rows = computed(() =>
	toInfoRows({
		taskVariables: props.task?.variables,
		threadVariables: variablesStore.value.variables,
	}),
);

// The window keeps this panel alive between tab switches, so a mount hook would
// run once; the thread's variables can change meanwhile, so re-read on every
// return to the tab.
onActivated(() => variablesStore.value.refresh());
</script>
