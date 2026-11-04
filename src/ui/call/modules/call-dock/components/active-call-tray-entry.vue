<template>
	<div
		ref="root"
		class="active-call-tray-entry"
		:class="{
			'active-call-tray-entry--expanded': expanded,
		}"
	>
		<slide-up-overlay :is-open="expanded">
			<call-dock
				:preview="preview"
				:displayed-time="timer.formatted.value"
				@toggle-mute="emit('toggleMute')"
				@toggle-hold="emit('toggleHold')"
				@transfer="emit('transfer')"
				@hangup="emit('hangup')"
				@send-digit="emit('sendDigit', $event)"
			/>
		</slide-up-overlay>

		<floating-call-widget
			:preview="preview"
			:displayed-time="timer.formatted.value"
			@toggle-expand="emit('update:expanded', !expanded)"
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

import SlideUpOverlay from '../../../../components/slide-up-overlay/slide-up-overlay.vue';
import { useActiveCallTimer } from '../composables/useActiveCallTimer';
import type { ActiveCallContent } from '../types/ActiveCallContent.types';
import CallDock from './call-dock.vue';
import FloatingCallWidget from './floating-call-widget.vue';

const props = defineProps<{
	preview: ActiveCallContent;
	expanded: boolean;
}>();

const emit = defineEmits<{
	'update:expanded': [
		isExpanded: boolean,
	];
	openFullView: [];
	toggleMute: [];
	toggleHold: [];
	transfer: [];
	hangup: [];
	sendDigit: [
		digit: string,
	];
}>();

const root = useTemplateRef<HTMLElement>('root');

/**
 * @author Oleksandr Palonnyi
 * a click outside the opened dock collapses it (AC_14.02.05); the guard keeps
 * the collapsed pill from emitting on every click elsewhere on the page
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
onClickOutside(root, () => {
	if (props.expanded) emit('update:expanded', false);
});

/**
 * @author Oleksandr Palonnyi
 * one timer for the pill and the dock chip, so the two never show different
 * times and only one interval runs per call
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
const timer = useActiveCallTimer({
	answeredAt: () => props.preview.answeredAt,
	isHold: () => props.preview.isHold,
});
</script>

<style scoped>
.active-call-tray-entry {
	position: relative;
}

/**
 * @author Oleksandr Palonnyi
 * while expanded the tray entry takes the dock's width, so the pill is as wide
 * as the dock and the dock does not cover the neighbouring pills
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
.active-call-tray-entry--expanded {
	width: var(--wt-ws-call-dock-sizes-root-min-width);
}
</style>
