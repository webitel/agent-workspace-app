<template>
	<div
		class="floating-call-widget"
		:class="{
			'floating-call-widget--hold': preview.isHold,
		}"
		@click="emit('toggleExpand')"
	>
		<padded-avatar
			:username="preview.name"
			:size="ComponentSize.XS"
			class="floating-call-widget__avatar"
		/>

		<span class="floating-call-widget__timer typo-body-1">
			{{ displayedTime }}
		</span>

		<wt-button
			:size="ComponentSize.SM"
			:color="buttonColor"
			:aria-label="t('ui.call.activeCall.actions.openFullView')"
			width-by-content
			@click.stop="emit('openFullView')"
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
import { useI18n } from 'vue-i18n';

import PaddedAvatar from '../../../../components/padded-avatar/padded-avatar.vue';
import type { ActiveCallContent } from '../types/ActiveCallContent.types';

const props = defineProps<{
	preview: ActiveCallContent;
	/** The call timer, or the time left of post-processing for an ended call. */
	displayedTime: string;
}>();

const emit = defineEmits<{
	toggleExpand: [];
	openFullView: [];
}>();

const { t } = useI18n();

const buttonColor = computed(() =>
	props.preview.isHold ? ButtonColor.WARN : ButtonColor.SUCCESS,
);
</script>

<style scoped>
.floating-call-widget {
	height: 40px;
	display: flex;
	align-items: center;
	gap: var(--wt-ws-call-dock-sizes-floating-call-widget-gap);
	padding: var(--wt-ws-call-dock-sizes-floating-call-widget-padding-x);
	border-radius: var(--wt-ws-call-dock-sizes-floating-call-widget-border-radius);
	background-color: var(--wt-ws-call-dock-colors-floating-call-widget-active-background);
	color: var(--wt-ws-call-dock-colors-floating-call-widget-active-color);
	cursor: pointer;
}

.floating-call-widget:hover {
	background-color: var(--wt-ws-call-dock-colors-floating-call-widget-active-hover-background);
}

.floating-call-widget__avatar {
	flex: 0 1 auto;
}

.floating-call-widget__timer {
	width: 50px;
	flex: 0 1 auto;
	text-align: start;
}

.floating-call-widget--hold {
	background-color: var(--wt-ws-call-dock-colors-floating-call-widget-hold-background);
	color: var(--wt-ws-call-dock-colors-floating-call-widget-hold-color);
}

.floating-call-widget--hold:hover {
	background-color: var(--wt-ws-call-dock-colors-floating-call-widget-hold-hover-background);
}
</style>
