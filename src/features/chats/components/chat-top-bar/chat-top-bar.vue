<template>
	<interaction-top-bar
		class="chat-top-bar"
		:name="header.name"
		:subtitle="header.queueName"
	>
		<template #leading>
			<wt-icon icon="history" />
		</template>

		<template #status>
			<post-processing-timer
				v-if="isPostProcessing"
				:task="task"
			/>
		</template>

		<template #actions>
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
		</template>
	</interaction-top-bar>
</template>

<script setup lang="ts">
import { eventBus } from '@webitel/ui-sdk/scripts';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Task } from 'webitel-sdk';
import InteractionTopBar from '../../../../ui/interaction-top-bar/interaction-top-bar.vue';
import PostProcessingTimer from '../../../processing/components/post-processing-timer.vue';
import { useProcessingStore } from '../../../processing/store/processing';
import { toChatHeader } from '../../scripts/toChatHeader';
import { useChatsStore } from '../../store/chats';
import ChatEndAction from './chat-end-action.vue';

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
