<template>
	<section class="chat-info">
		<wt-message
			v-if="isClosed"
			class="chat-info__notice"
			color="info"
		>
			{{ t('ui.pages.chats.closed.taskVariablesUnavailable') }}
		</wt-message>

		<!-- keyed by chat: the table's sort must not follow the agent into another -->
		<variables-table
			:key="threadId"
			:rows="rows"
			:is-pending="isPending"
			:is-loading="variablesStore?.isLoading"
			:error="variablesStore?.error"
			@retry="variablesStore?.refresh()"
		/>
	</section>
</template>

<script setup lang="ts">
import { WtMessage } from '@webitel/ui-sdk/components';
import { computed, onActivated } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Task } from 'webitel-sdk';

import VariablesTable from '../../../variables/components/variables-table.vue';
import { toInfoRows } from '../../scripts/toInfoRows';
import { useChatVariablesStore } from '../../store/chat-variables';
import type { ThreadVariablesModel } from '../../types/ChatSession.types';

const props = defineProps<{
	/** the chat's call-center task; absent once the task has left the feed */
	task?: Task;
	threadId: string;
	/**
	 * The variables of a closed chat's left thread. When set, they are the whole
	 * Info tab: the chat has no task, and a former member cannot read the
	 * thread's variables over REST.
	 */
	closedThreadVariables?: ThreadVariablesModel['variables'];
}>();

const { t } = useI18n();

const isClosed = computed(() => props.closedThreadVariables !== undefined);

// Resolved reactively: the chat window reuses this instance across chats. A
// closed chat has no store: it would only be a read that cannot succeed.
const variablesStore = computed(() =>
	isClosed.value ? null : useChatVariablesStore(props.threadId),
);

// a closed chat has all it has at once
const isPending = computed(() => variablesStore.value?.isLoaded === false);

const rows = computed(() =>
	toInfoRows(
		isClosed.value
			? {
					threadVariables: props.closedThreadVariables,
				}
			: {
					taskVariables: props.task?.variables,
					threadVariables: variablesStore.value?.variables,
				},
	),
);

// The window keeps this panel alive between tab switches, so a mount hook would
// run once; the thread's variables can change meanwhile, so re-read on every
// return to the tab.
onActivated(() => variablesStore.value?.refresh());
</script>

<style scoped>
.chat-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
}

.chat-info__notice {
	flex: 0 0 auto;
	margin-bottom: var(--spacing-xs);
}
</style>
