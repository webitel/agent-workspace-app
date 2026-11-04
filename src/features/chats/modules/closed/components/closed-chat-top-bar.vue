<template>
	<!-- no status and no actions: a closed chat has no deadline to keep and
	     nothing to end or transfer (ADR-0010) -->
	<task-top-bar
		class="closed-chat-top-bar"
		:name="header.name"
		:subtitle="header.queueName"
		:subtitle-label="t('ui.notifications.offer.queue')"
	>
		<template #leading>
			<wt-icon icon="lock" />
			<wt-avatar
				:username="header.name"
				size="sm"
			/>
		</template>
	</task-top-bar>
</template>

<script
	setup
	lang="ts"
>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import TaskTopBar from '../../../../../ui/task-top-bar/task-top-bar.vue';
import type { ILeftThread } from '../../../types/ChatSession.types';
import { toClosedChatHeader } from '../scripts/toClosedChatHeader';

const props = defineProps<{
	thread: ILeftThread;
}>();

const { t } = useI18n();

const header = computed(() => toClosedChatHeader(props.thread));
</script>
