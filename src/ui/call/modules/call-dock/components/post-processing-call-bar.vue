<template>
	<!-- an ended call has nothing to control: the card only leads back to its
	     Call window, where the form waits (AC_13.02.04) -->
	<call-dock
		class="post-processing-call-bar"
		:preview="preview"
		:displayed-time="timeLeft"
		is-hung-up
		@open-full-view="emit('openFullView')"
	/>
</template>

<script
	setup
	lang="ts"
>
import type { Task } from 'webitel-sdk';

import { usePostProcessingCountdown } from '../../../../../features/processing/composables/usePostProcessingCountdown';
import type { ActiveCallContent } from '../types/ActiveCallContent.types';
import CallDock from './call-dock.vue';

/**
 * The dock's card for a call that has hung up but is still in
 * post-processing: the active call's card without its actions, showing the
 * time left of the deadline in place of the talk timer.
 * [WS-91](https://webitel.atlassian.net/browse/WS-91)
 * [WS-159](https://webitel.atlassian.net/browse/WS-159)
 */
const props = defineProps<{
	preview: ActiveCallContent;
	task: Task;
}>();

const emit = defineEmits<{
	openFullView: [];
}>();

const { timeLeft } = usePostProcessingCountdown(() => props.task);
</script>
