<template>
	<div
		v-if="numpadStore.isOpen || outboundCardState"
		class="the-dialer-panel"
	>
		<the-numpad
			v-if="numpadStore.isOpen"
			:initial-number="numpadStore.prefilledNumber"
			@call="onCall"
		/>
		<outbound-call-card
			v-else-if="outboundCardState && outboundCallStore.preview"
			:preview="outboundCallStore.preview"
			:state="outboundCardState"
			:is-muted="outboundCallStore.isMuted"
			:can-toggle-mute="Boolean(outboundCallStore.placedCall)"
			@toggle-mute="outboundCallStore.toggleMute"
			@hangup="outboundCallStore.hangup"
			@retry="outboundCallStore.retry"
			@back-to-dialpad="onBackToDialpad"
		/>
	</div>
</template>

<script
	setup
	lang="ts"
>
import { computed } from 'vue';

import { OutboundCallStatus } from '../../../features/calls/enums/OutboundCallStatus.enum';
import { useOutboundCallStore } from '../../../features/calls/store/outboundCall';
import TheNumpad from '../../numpad/components/the-numpad.vue';
import { useNumpadStore } from '../../numpad/store/numpad';
import { OutboundCallCardState } from '../enums/OutboundCallCardState.enum';
import OutboundCallCard from './outbound-call-card.vue';

const numpadStore = useNumpadStore();
const outboundCallStore = useOutboundCallStore();

/**
 * @author Oleksandr Palonnyi
 * The numpad and the outbound call card are variants of one "Dialer" card in
 * the design, so they share this panel. An explicitly opened numpad wins; an
 * answered call leaves the card for the active-call window (AC_16.01.06).
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
const outboundCardState = computed<OutboundCallCardState | null>(() => {
	switch (outboundCallStore.status) {
		case OutboundCallStatus.Dialing:
		case OutboundCallStatus.Ringing:
			return OutboundCallCardState.Ringing;
		case OutboundCallStatus.NoAnswer:
			return OutboundCallCardState.NoAnswer;
		default:
			return null;
	}
});

/**
 * @author Oleksandr Palonnyi
 * US_16.01 AC_16.01.03: the numpad closes as soon as the call is placed; the
 * call's progress is shown by the outbound call card instead.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
function onCall(destination: string) {
	numpadStore.close();
	outboundCallStore.dial(destination);
}

/**
 * @author Oleksandr Palonnyi
 * US_16.01 AC_16.01.05: the card closes and the numpad reopens with the number
 * that went unanswered, so the agent can correct it.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
function onBackToDialpad() {
	const unansweredNumber = outboundCallStore.destination ?? '';
	outboundCallStore.dismiss();
	numpadStore.open(unansweredNumber);
}
</script>

<style scoped>
.the-dialer-panel {
	position: absolute;
	bottom: var(--spacing-sm);
	left: var(--spacing-sm);
	z-index: 101;
	border-radius: var(--p-border-radius-lg);
	background-color: var(--content-wrapper-color);
	box-shadow: var(--elevation-10);
}
</style>
