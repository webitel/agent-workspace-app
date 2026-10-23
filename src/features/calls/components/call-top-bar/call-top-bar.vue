<template>
	<!-- WS-91 holds the slot; the call's actions and the post-processing timer
	     arrive with the top panel story (WS-87) -->
	<task-top-bar
		class="call-top-bar"
		:name="preview.number || preview.name"
		:subtitle="preview.queueName"
		:subtitle-label="t('ui.notifications.offer.queue')"
	>
		<template #leading>
			<wt-icon
				color="success"
				icon="ws-chat-clock"
			/>
		</template>
	</task-top-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Call } from 'webitel-sdk';
import TaskTopBar from '../../../../ui/task-top-bar/task-top-bar.vue';
import { toActiveCallContent } from '../../scripts/toActiveCallContent';

const props = defineProps<{
	call: Call;
}>();

const { t } = useI18n();

// Same identity as the dock's pill, masking included; the bar leads with the
// number (AC_13.01.01).
const preview = computed(() => toActiveCallContent(props.call));
</script>
