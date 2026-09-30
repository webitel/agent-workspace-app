<template>
	<header class="chat-top-bar">
		<wt-icon
			class="chat-top-bar__clock"
			icon="history"
		/>
		<wt-avatar
			:username="header.name"
			size="sm"
		/>
		<div class="chat-top-bar__info">
			<span class="chat-top-bar__name typo-body-1-bold">{{ header.name }}</span>
			<span
				v-if="header.queueName"
				class="chat-top-bar__queue typo-body-2"
			>
				{{ header.queueName }}
			</span>
		</div>

		<div class="chat-top-bar__actions">
			<chat-top-bar-timer
				v-if="isPostProcessing"
				:task="task"
			/>
			<!-- not in the MVP: Е6 owns the transfer flow, the button holds its place -->
			<wt-icon-btn
				:aria-label="t('ui.pages.chats.topBar.transfer')"
				icon="chat-transfer--filled"
				disabled
			/>
			<chat-end-action
				v-if="!isPostProcessing"
				:callback="end"
				:disabled="!selfMember"
				:is-ending="isEnding"
			/>
		</div>
	</header>
</template>

<script setup lang="ts">
import { eventBus } from '@webitel/ui-sdk/scripts';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Task } from 'webitel-sdk';

import { useProcessingStore } from '../../../processing/store/processing';
import { toChatHeader } from '../../scripts/toChatHeader';
import { useChatsStore } from '../../store/chats';
import ChatEndAction from './chat-end-action.vue';
import ChatTopBarTimer from './chat-top-bar-timer.vue';

const props = defineProps<{
	task: Task;
}>();

const { t } = useI18n();
const chatsStore = useChatsStore();

const header = computed(() => toChatHeader(props.task));
const isPostProcessing = computed(
	() => useProcessingStore(props.task).isPostProcessing,
);

// Without it the request cannot be made; the button says so by being disabled
// instead of doing nothing (ADR-0005).
const selfMember = computed(() => chatsStore.getSelfMember(props.task));

const isEnding = ref(false);

// One bar serves every chat the window shows; a pending end is not the next
// chat's.
watch(
	() => props.task.id,
	() => {
		isEnding.value = false;
	},
);

async function end() {
	isEnding.value = true;
	try {
		await chatsStore.endChat(props.task);
	} catch (err) {
		isEnding.value = false;
		eventBus.$emit('notification', {
			type: 'error',
			text: err instanceof Error ? err.message : String(err),
		});
	}
}
</script>

<style scoped>
.chat-top-bar {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	padding-bottom: var(--spacing-xs);
}

.chat-top-bar__info {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.chat-top-bar__name,
.chat-top-bar__queue {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.chat-top-bar__queue {
	color: var(--text-secondary-color);
}

.chat-top-bar__actions {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	margin-left: auto;
}
</style>
