<template>
	<div
		class="active-call-bar"
		:class="{
			'active-call-bar--hold': preview.isHold,
		}"
	>
		<padded-avatar
			:username="preview.name"
			:size="ComponentSize.XS"
			class="active-call-bar__avatar"
		/>

		<span class="active-call-bar__timer typo-body-1">
			{{ timer.formatted.value }}
		</span>

		<wt-button
			:size="ComponentSize.SM"
			:color="buttonColor"
			width-by-content
		>
			<wt-icon
				icon="ws-open-full-view"
				:size="ComponentSize.SM"
				:color="IconColor.ON_DARK"
			/>
		</wt-button>
	</div>
</template>

<script
	setup
	lang="ts"
>
import { ButtonColor, ComponentSize, IconColor } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';

import PaddedAvatar from '../../components/padded-avatar/padded-avatar.vue';
import { useActiveCallTimer } from '../composables/useActiveCallTimer';
import type { ActiveCallPreview } from '../types/ActiveCallPreview.types';

const props = defineProps<{
	preview: ActiveCallPreview;
}>();

const timer = useActiveCallTimer({
	answeredAt: () => props.preview.answeredAt,
	isHold: () => props.preview.isHold,
});

const buttonColor = computed(() =>
	props.preview.isHold ? ButtonColor.WARN : ButtonColor.SUCCESS,
);
</script>

<style scoped>
.active-call-bar {
	height: 40px;
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	padding: var(--spacing-2xs);
	border-radius: var(--p-border-radius-lg);
	background-color: var(--wt-ws-call-dock-colors-floating-call-widget-active-background);
	color: var(--wt-ws-call-dock-colors-floating-call-widget-active-color);
}

.active-call-bar__avatar {
	flex: 0 1 auto;
}

.active-call-bar__timer {
	width: 50px;
	flex: 0 1 auto;
}

.active-call-bar--hold {
	background-color: var(--wt-ws-call-dock-colors-floating-call-widget-hold-background);
	color: var(--wt-ws-call-dock-colors-floating-call-widget-hold-color);
}
</style>
