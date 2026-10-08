<template>
	<task-top-bar
		class="chat-top-bar"
		:name="header.name"
		:subtitle="header.queueName"
		:subtitle-label="t('ui.notifications.offer.queue')"
	>
		<template #leading>
			<wt-icon
				color="success"
				icon="ws-chat-clock"
			/>
		</template>

		<template #status>
			<post-processing-timer
				v-if="isPostProcessing"
				:task="task"
			/>
		</template>

		<template #actions>
			<!-- not in the MVP: Е6 owns the transfer flow, the button holds its place -->
			<wt-button
				:aria-label="t('ui.pages.chats.topBar.transfer')"
				color="transfer"
				icon="chat-transfer--filled"
				size="sm"
				disabled
			/>
			<wt-tooltip v-if="!isPostProcessing">
				<template #activator>
					<div>
						<wt-button
							:loading="isEnding"
							:aria-label="t('ui.pages.chats.topBar.end')"
							color="error"
							icon="chat-end--filled"
							size="sm"
							@click="end"
						/>
					</div>
				</template>
				{{ t('ui.pages.chats.topBar.end') }}
			</wt-tooltip>
		</template>
	</task-top-bar>
</template>

<script setup lang="ts">
import { eventBus } from '@webitel/ui-sdk/scripts';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Task } from 'webitel-sdk';
import TaskTopBar from '../../../../ui/task-top-bar/task-top-bar.vue';
import PostProcessingTimer from '../../../processing/components/post-processing-timer.vue';
import { useProcessingStore } from '../../../processing/store/processing';
import { toChatHeader } from '../../scripts/toChatHeader';
import { useChatsStore } from '../../store/chats';

const props = defineProps<{
	task: Task;
}>();

const { t } = useI18n();
const chatsStore = useChatsStore();

const header = computed(() => toChatHeader(props.task));
const isPostProcessing = computed(
	() => useProcessingStore(props.task).isPostProcessing,
);

// Stays on after the request resolves: the backend flips the task's state only
// later, and a second click in between would fire against a chat already ending.
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
