<template>
	<div
		v-if="numpadStore.isOpen || visibleAttempts.length"
		class="the-numpad-panel"
	>
		<div
			v-if="numpadStore.isOpen"
			class="the-numpad-panel__card"
		>
			<the-numpad @call="onCall" />
		</div>
		<div
			v-for="attempt of visibleAttempts"
			:key="attempt.id"
			class="the-numpad-panel__card"
		>
			<outbound-call-card
				:preview="attempt.preview"
				:status="attempt.status"
				:is-muted="attempt.isMuted"
				:can-toggle-mute="Boolean(attempt.placedCall)"
				@toggle-mute="outboundCallAttemptsStore.toggleMute(attempt.id)"
				@hangup="outboundCallAttemptsStore.hangup(attempt.id)"
				@retry="outboundCallAttemptsStore.retry(attempt.id)"
				@close="outboundCallAttemptsStore.clearAttempt(attempt.id)"
				@back-to-dialpad="onBackToDialpad(attempt.id)"
			/>
		</div>
	</div>
</template>

<script
	setup
	lang="ts"
>
import { computed } from 'vue';

import { OutboundCallStatus } from '../../../features/calls/enums/OutboundCallStatus.enum';
import { useOutboundCallAttemptsStore } from '../../../features/calls/store/outboundCallAttempts';
import OutboundCallCard from '../../call/components/outbound-call-card.vue';
import { useNumpadStore } from '../store/numpad';
import TheNumpad from './the-numpad.vue';

const CARD_VISIBLE_STATUSES: OutboundCallStatus[] = [
	OutboundCallStatus.Dialing,
	OutboundCallStatus.Ringing,
	OutboundCallStatus.NoAnswer,
];

const numpadStore = useNumpadStore();
const outboundCallAttemptsStore = useOutboundCallAttemptsStore();

/**
 * @author Oleksandr Palonnyi
 * The numpad and the outbound call cards are variants of one card in the design
 * (hence the `--wt-ws-dialer-*` tokens), so they share this panel. The numpad stays
 * open beside the cards, since the agent may dial again before the first attempt is answered; an
 * answered call leaves its card for the active call window (AC_16.01.06)
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
const visibleAttempts = computed(() =>
	outboundCallAttemptsStore.attempts.filter((attempt) =>
		CARD_VISIBLE_STATUSES.includes(attempt.status),
	),
);

/**
 * @author Oleksandr Palonnyi
 * The numpad closes as soon as the call is placed (AC_16.01.03); the call's
 * progress is shown by the outbound call card instead
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
function onCall(destination: string) {
	numpadStore.close();
	outboundCallAttemptsStore.start(destination);
}

/**
 * @author Oleksandr Palonnyi
 * The card closes and the numpad reopens empty. AC_16.01.05 only says the numpad
 * opens; the number that went unanswered was carried over by the first
 * implementation and is not part of the spec. Done here rather than in the
 * outbound call attempts store, since a `features/` store does not drive `ui/` state
 * [WS-158](https://webitel.atlassian.net/browse/WS-158)
 */
function onBackToDialpad(attemptId: string) {
	outboundCallAttemptsStore.clearAttempt(attemptId);
	numpadStore.open();
}
</script>

<style scoped>
/**
 * @author Oleksandr Palonnyi
 * The Dialer spec pins the panel to the viewport's bottom edge, beside the nav without
 * covering it. The offset is the rail's own width plus a gap, so it follows the rail
 * instead of a literal. The spec's 52px is the 48px rail plus 4px; the design gap
 * agreed for this fix is 8px (`--spacing-xs`), so the panel sits at 56px
 * [WS-157](https://webitel.atlassian.net/browse/WS-157)
 */
.the-numpad-panel {
	position: fixed;
	bottom: 0;
	left: calc(var(--wt-navigation-rail-width) + var(--spacing-xs));
	z-index: 101;
	display: flex;
	align-items: flex-end;
	gap: var(--wt-ws-dialer-sizes-root-gap);
}

.the-numpad-panel__card {
	border-radius: var(--wt-ws-dialer-sizes-root-border-radius);
	background-color: var(--wt-ws-dialer-colors-root-background);
	box-shadow: var(--elevation-10);
}
</style>
