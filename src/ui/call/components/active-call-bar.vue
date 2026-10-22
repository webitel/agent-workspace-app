<template>
	<div
		ref="root"
		class="active-call-bar"
		:class="{
			'active-call-bar--expanded': expanded,
		}"
	>
		<slide-up-overlay :is-open="expanded">
			<active-call-card
				:preview="preview"
				:elapsed-time="timer.formatted.value"
				@toggle-mute="emit('toggleMute')"
				@toggle-hold="emit('toggleHold')"
				@hangup="emit('hangup')"
				@open-full-view="emit('openFullView')"
				@send-digit="emit('sendDigit', $event)"
			/>
		</slide-up-overlay>

		<floating-call-widget
			:preview="preview"
			:elapsed-time="timer.formatted.value"
			@toggle-expand="emit('toggleExpand')"
			@open-full-view="emit('openFullView')"
		/>
	</div>
</template>

<script
	setup
	lang="ts"
>
import { onClickOutside } from '@vueuse/core';
import { useTemplateRef } from 'vue';
import SlideUpOverlay from '../../components/slide-up-overlay/slide-up-overlay.vue';
import { useActiveCallTimer } from '../composables/useActiveCallTimer';
import type { ActiveCallPreview } from '../types/ActiveCallPreview.types';
import ActiveCallCard from './active-call-card.vue';
import FloatingCallWidget from './floating-call-widget.vue';

const props = defineProps<{
	preview: ActiveCallPreview;
	expanded: boolean;
}>();

const emit = defineEmits<{
	toggleExpand: [];
	collapse: [];
	toggleMute: [];
	toggleHold: [];
	hangup: [];
	openFullView: [];
	sendDigit: [
		digit: string,
	];
}>();

const root = useTemplateRef<HTMLElement>('root');

/**
 * @author Oleksandr Palonnyi
 * a click outside the opened card collapses it (AC_14.02.05); the guard keeps
 * the collapsed pill from emitting on every click elsewhere on the page
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
onClickOutside(root, () => {
	if (props.expanded) emit('collapse');
});

/**
 * @author Oleksandr Palonnyi
 * one timer for the pill and the card chip, so the two never show different
 * times and only one interval runs per call
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
const timer = useActiveCallTimer({
	answeredAt: () => props.preview.answeredAt,
	isHold: () => props.preview.isHold,
});
</script>

<style scoped>
/**
 * @author Oleksandr Palonnyi
 * the card reads this width too: while expanded the bar takes the card's
 * width, so the pill is as wide as the card and the card does not cover the
 * neighbouring pills
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
.active-call-bar {
	--active-call-bar-card-width: 280px;

	position: relative;
}

.active-call-bar--expanded {
	width: var(--active-call-bar-card-width);
}
</style>
