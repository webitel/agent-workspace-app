<template>
	<div class="call-top-bar-actions">
		<!-- not in the MVP: the numpad (AC_13.01.03), video (AC_13.01.05) and the
		     video call's chat (AC_13.01.07) get stories of their own; the
		     buttons hold their place -->
		<wt-button
			:aria-label="t('ui.call.activeCall.actions.numpad')"
			color="secondary"
			icon="numpad"
			size="sm"
			variant="text"
			width-by-content
			disabled
		/>
		<wt-button
			:aria-label="t('ui.call.activeCall.actions.mute')"
			:aria-pressed="isMuted"
			:icon="isMuted ? 'mic-muted' : 'mic'"
			:variant="toggleVariant(isMuted)"
			color="secondary"
			size="sm"
			width-by-content
			@click="callsStore.toggleMute(call.id)"
		/>
		<wt-button
			:aria-label="t('ui.call.activeCall.actions.camera')"
			color="secondary"
			icon="video-cam-off"
			size="sm"
			variant="text"
			width-by-content
			disabled
		/>
		<wt-button
			:aria-label="t('ui.call.activeCall.actions.hold')"
			:aria-pressed="call.isHold"
			:variant="toggleVariant(call.isHold)"
			color="secondary"
			icon="hold"
			size="sm"
			width-by-content
			@click="callsStore.toggleHold(call.id)"
		/>
		<wt-button
			:aria-label="t('ui.call.activeCall.actions.message')"
			color="secondary"
			icon="chat"
			size="sm"
			variant="text"
			width-by-content
			disabled
		/>

		<wt-divider
			class="call-top-bar-actions__divider"
			variant="vertical"
		/>

		<wt-button
			:aria-label="t('ui.call.activeCall.actions.transfer')"
			color="transfer"
			icon="call-transfer--filled"
			size="sm"
			@click="callTransferStore.open(call.id)"
		/>
		<wt-button
			:aria-label="t('ui.call.activeCall.actions.hangup')"
			color="error"
			icon="call-end--filled"
			size="sm"
			@click="callsStore.hangup(call.id)"
		/>
	</div>
</template>

<script setup lang="ts">
import { ButtonVariant } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Call } from 'webitel-sdk';
import { useCallTransferStore } from '../../../../ui/call/modules/call-transfer/store/callTransfer';
import { useCallsStore } from '../../store/calls';

const props = defineProps<{
	call: Call;
}>();

const { t } = useI18n();
const callsStore = useCallsStore();
const callTransferStore = useCallTransferStore();

const isMuted = computed(() => Boolean(props.call.muted));

// wt-button has no pressed state of its own; the dock's actions mark one by
// filling the button, and the bar follows suit
const toggleVariant = (isPressed: boolean) =>
	isPressed ? ButtonVariant.ACTIVE : ButtonVariant.TEXT;
</script>

<style scoped>
.call-top-bar-actions {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

/* a vertical divider is as tall as its container, which sets no height of its
   own; stretched, it spans the buttons as in DES-711 */
.call-top-bar-actions__divider {
	align-self: stretch;
	min-height: auto;
	padding: 0;
}
</style>
