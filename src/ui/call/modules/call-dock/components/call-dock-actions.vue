<template>
	<div class="call-dock-actions">
		<wt-button
			icon="numpad"
			:size="ComponentSize.SM"
			:icon-color="getIconColor(isNumpadOpen, IconColor.DEFAULT)"
			:color="ButtonColor.SECONDARY"
			:variant="getActionVariant(isNumpadOpen)"
			:aria-label="t('ui.call.activeCall.actions.numpad')"
			:aria-pressed="isNumpadOpen"
			width-by-content
			@click="emit('toggleNumpad')"
		/>
		<wt-button
			:icon="isMuted ? 'mic-muted' : 'mic'"
			:size="ComponentSize.SM"
			:icon-color="getIconColor(isMuted, IconColor.DEFAULT)"
			:color="ButtonColor.SECONDARY"
			:variant="getActionVariant(isMuted)"
			:aria-label="t('ui.call.activeCall.actions.mute')"
			:aria-pressed="isMuted"
			width-by-content
			@click="emit('toggleMute')"
		/>
		<wt-button
			icon="hold"
			:size="ComponentSize.SM"
			:icon-color="getIconColor(isHold, IconColor.DEFAULT)"
			:color="ButtonColor.SECONDARY"
			:variant="getActionVariant(isHold)"
			:aria-label="t('ui.call.activeCall.actions.hold')"
			:aria-pressed="isHold"
			width-by-content
			@click="emit('toggleHold')"
		/>
		<wt-button
			icon="call-transfer--filled"
			:size="ComponentSize.SM"
			:icon-color="IconColor.TRANSFER"
			:color="ButtonColor.TRANSFER"
			:variant="ButtonVariant.TEXT"
			:aria-label="t('ui.call.activeCall.actions.transfer')"
			width-by-content
			@click="emit('transfer')"
		/>
		<wt-button
			icon="call-end--filled"
			:size="ComponentSize.SM"
			:icon-color="IconColor.ERROR"
			:color="ButtonColor.ERROR"
			:variant="ButtonVariant.TEXT"
			:aria-label="t('ui.call.activeCall.actions.hangup')"
			width-by-content
			@click="emit('hangup')"
		/>
	</div>
</template>

<script
	setup
	lang="ts"
>
import {
	ButtonColor,
	ButtonVariant,
	ComponentSize,
	IconColor,
} from '@webitel/ui-sdk/enums';
import { useI18n } from 'vue-i18n';

defineProps<{
	isNumpadOpen: boolean;
	isMuted: boolean;
	isHold: boolean;
}>();

const emit = defineEmits<{
	toggleNumpad: [];
	toggleMute: [];
	toggleHold: [];
	transfer: [];
	hangup: [];
}>();

const { t } = useI18n();

/**
 * @author Oleksandr Palonnyi
 * wt-button has no active prop, so an active action is marked by switching
 * the button from the text to the filled (ButtonVariant.ACTIVE) variant
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
const getActionVariant = (isActive: boolean): ButtonVariant =>
	isActive ? ButtonVariant.ACTIVE : ButtonVariant.TEXT;

const getIconColor = (isActive: boolean, idleColor: IconColor): IconColor =>
	isActive ? IconColor.ACTIVE : idleColor;
</script>

<style scoped>
.call-dock-actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
</style>
