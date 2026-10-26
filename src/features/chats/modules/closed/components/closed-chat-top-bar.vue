<template>
	<!-- no status and no actions: a closed chat has no deadline to keep and
	     nothing to end or transfer (ADR-0010) -->
	<task-top-bar
		class="closed-chat-top-bar"
		:name="header.name"
	>
		<template #leading>
			<wt-icon icon="lock" />
		</template>
	</task-top-bar>
</template>

<script
	setup
	lang="ts"
>
import { computed } from 'vue';

import TaskTopBar from '../../../../../ui/task-top-bar/task-top-bar.vue';
import { useUserinfoStore } from '../../../../userinfo/stores/userinfoStore';
import type { ILeftThread } from '../../../types/ChatSession.types';
import { toClosedChatHeader } from '../scripts/toClosedChatHeader';

const props = defineProps<{
	thread: ILeftThread;
}>();

const userinfoStore = useUserinfoStore();

const header = computed(() =>
	toClosedChatHeader(props.thread, userinfoStore.userId),
);
</script>
