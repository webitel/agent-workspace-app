<template>
	<div class="post-processing-call-bar">
		<!-- an ended call has nothing to control: the card only leads back to its
		     Call window, where the form waits (AC_13.02.04) -->
		<slide-up-overlay is-open>
			<call-dock
				:preview="preview"
				:displayed-time="timeLeft"
				:can-bridge="false"
				is-hung-up
				@open-full-view="emit('openFullView')"
			/>
		</slide-up-overlay>
	</div>
</template>

<script
	setup
	lang="ts"
>
import type { Task } from 'webitel-sdk';

import { usePostProcessingCountdown } from '../../../../../features/processing/composables/usePostProcessingCountdown';
import SlideUpOverlay from '../../../../components/slide-up-overlay/slide-up-overlay.vue';
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

<style scoped>
/**
 * @author Oleksandr Palonnyi
 * the card is far taller than the dock strip, and in the strip's flow it grew
 * the dock and took that height from the page and the right panel above it.
 * like the expanded active call's card it floats up over the content instead:
 * the bar keeps the card's width, so it does not cover the neighbouring pills,
 * and no height of its own
 * [WS-192](https://webitel.atlassian.net/browse/WS-192)
 */
.post-processing-call-bar {
	position: relative;
	width: var(--wt-ws-call-dock-sizes-root-min-width);
}
</style>
