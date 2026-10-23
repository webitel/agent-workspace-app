<template>
	<task-top-bar
		class="call-top-bar"
		:name="preview.number"
		:subtitle="preview.queueName"
		:subtitle-label="t('ui.notifications.offer.queue')"
	>
		<template #leading>
			<wt-icon
				color="success"
				icon="ws-chat-clock"
			/>
		</template>

		<template #name-append>
			<wt-copy-action
				v-if="copyableNumber"
				:value="copyableNumber"
				color="info"
				size="sm"
			/>
		</template>

		<template #status>
			<post-processing-timer
				v-if="postProcessingTask"
				:task="postProcessingTask"
			/>
		</template>

		<template #actions>
			<call-top-bar-actions
				v-if="isConnected"
				:call="call"
			/>
		</template>
	</task-top-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Call } from 'webitel-sdk';
import TaskTopBar from '../../../../ui/task-top-bar/task-top-bar.vue';
import PostProcessingTimer from '../../../processing/components/post-processing-timer.vue';
import { useProcessingStore } from '../../../processing/store/processing';
import { isActiveCall } from '../../scripts/isActiveCall';
import { toActiveCallPreview } from '../../scripts/toActiveCallPreview';
import CallTopBarActions from './call-top-bar-actions.vue';

const props = defineProps<{
	call: Call;
}>();

const { t } = useI18n();

// Same identity as the dock's pill, masking included. The bar shows the number
// alone (AC_13.01.01): the contact's name is the right panel's (US_13.06).
const preview = computed(() => toActiveCallPreview(props.call));

// A hidden number is never put on the clipboard, masked or not: the mask is
// useless there and the real one is what `hideNumber` withholds.
const copyableNumber = computed(() =>
	props.call.hideNumber ? undefined : props.call.displayNumber || undefined,
);

// The bar's two states follow the call, not the task: a form can land mid-call
// without the call's actions going anywhere, and once hung up there is nothing
// left to mute, hold, transfer or end.
const isConnected = computed(() => isActiveCall(props.call));

const postProcessingTask = computed(() => {
	const { task } = props.call;
	if (isConnected.value || !task) return null;
	return useProcessingStore(task).isPostProcessing ? task : null;
});
</script>

<style scoped>
/* DES-711 sets the caller's number in italic, like the queue beneath it */
.call-top-bar :deep(.task-top-bar__name) {
	font-style: italic;
}
</style>
