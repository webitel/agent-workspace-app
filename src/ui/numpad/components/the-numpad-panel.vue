<template>
	<div
		v-if="numpadStore.isOpen || visibleAttempts.length"
		class="the-numpad-panel"
	>
		<div
			v-if="numpadStore.isOpen"
			class="the-numpad-panel__card"
		>
			<the-numpad
				:initial-number="numpadStore.prefilledNumber"
				@call="onCall"
			/>
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
				@back-to-dialpad="onBackToDialpad(attempt.id, attempt.destination)"
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
import OutboundCallCard from '../../dialer/components/outbound-call-card.vue';
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
 * The numpad and the outbound call cards are variants of one "Dialer" card in
 * the design, so they share this panel. The numpad stays open beside the cards,
 * since the agent may dial again before the first attempt is answered; an
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
 * The card closes and the numpad reopens with the number that went unanswered,
 * so the agent can correct it (AC_16.01.05). Done here rather than in the
 * outbound call attempts store, since a `features/` store does not drive `ui/` state
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
function onBackToDialpad(attemptId: string, unansweredNumber: string) {
	outboundCallAttemptsStore.clearAttempt(attemptId);
	numpadStore.open(unansweredNumber);
}
</script>

<style scoped>
/**
 * @author Oleksandr Palonnyi
 * The left offset is an interim value that clears the nav: the nav has no width token yet
 * to position against
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
.the-numpad-panel {
	position: fixed;
	bottom: var(--spacing-xl);
	left: var(--spacing-xl);
	z-index: 101;
	display: flex;
	align-items: flex-end;
	gap: var(--spacing-xs);
}

.the-numpad-panel__card {
	border-radius: var(--p-border-radius-lg);
	background-color: var(--content-wrapper-color);
	box-shadow: var(--elevation-10);
}
</style>
