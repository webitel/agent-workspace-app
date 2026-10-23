<template>
	<div
		class="floating-call-widget"
		:class="{
			'floating-call-widget--hold': preview.isHold,
		}"
	>
		<button
			type="button"
			class="floating-call-widget__toggle"
			@click="emit('toggleExpand')"
		>
			<padded-avatar
				:username="preview.name"
				:size="ComponentSize.XS"
				class="floating-call-widget__avatar"
			/>

			<span class="floating-call-widget__timer typo-body-1">
				{{ elapsedTime }}
			</span>
		</button>

		<wt-button
			v-if="preview.isPostProcessingEnabled"
			:size="ComponentSize.SM"
			:color="buttonColor"
			:aria-label="t('ui.call.activeCall.actions.openFullView')"
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
import { useI18n } from 'vue-i18n';

import PaddedAvatar from '../../../../components/padded-avatar/padded-avatar.vue';
import type { ActiveCallContent } from '../types/ActiveCallContent.types';

const props = defineProps<{
	preview: ActiveCallContent;
	elapsedTime: string;
}>();

const emit = defineEmits<{
	toggleExpand: [];
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
}

.floating-call-widget:hover {
	background-color: var(--wt-ws-call-dock-colors-floating-call-widget-active-hover-background);
}

.floating-call-widget__toggle {
	display: flex;
	flex: 1;
	align-items: center;
	gap: var(--wt-ws-call-dock-sizes-floating-call-widget-gap);
	min-width: 0;
	padding: 0;
	border: 0;
	background: none;
	color: inherit;
	font: inherit;
	cursor: pointer;
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
