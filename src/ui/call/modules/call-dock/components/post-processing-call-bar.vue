<template>
	<!-- an ended call has no actions to expand into: the widget only leads back
	     to its Call window, where the form waits (AC_13.02.04) -->
	<floating-call-widget
		class="post-processing-call-bar"
		:preview="preview"
		:time-left="timeLeft"
		@click="emit('openFullView')"
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
import FloatingCallWidget from './floating-call-widget.vue';

/**
 * The dock's widget for a call that has hung up but is still in
 * post-processing: the time left of its deadline in place of the talk timer.
 * [WS-91](https://webitel.atlassian.net/browse/WS-91)
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
