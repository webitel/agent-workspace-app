<template>
	<div
		v-if="numpadStore.isOpen || visibleAttempts.length"
		class="the-dialer-panel"
	>
		<div
			v-if="numpadStore.isOpen"
			class="the-dialer-panel__card"
		>
			<the-numpad
				:initial-number="numpadStore.prefilledNumber"
				@call="onCall"
			/>
		</div>
		<div
			v-for="attempt of visibleAttempts"
			:key="attempt.id"
			class="the-dialer-panel__card"
		>
			<outbound-call-card
				:preview="attempt.preview"
				:state="attempt.cardState"
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
import TheNumpad from '../../numpad/components/the-numpad.vue';
import { useNumpadStore } from '../../numpad/store/numpad';
import { OutboundCallCardState } from '../enums/OutboundCallCardState.enum';
import OutboundCallCard from './outbound-call-card.vue';

const numpadStore = useNumpadStore();
const outboundCallAttemptsStore = useOutboundCallAttemptsStore();

function getOutboundCardState(
	status: OutboundCallStatus,
): OutboundCallCardState | null {
	switch (status) {
		case OutboundCallStatus.Dialing:
		case OutboundCallStatus.Ringing:
			return OutboundCallCardState.Ringing;
		case OutboundCallStatus.NoAnswer:
			return OutboundCallCardState.NoAnswer;
		default:
			return null;
	}
}

// TEMP-FIGMA-MOCK start
const mockedAttempts = [
	{
		id: 'mock-ringing',
		destination: '0671234567',
		placedCall: {},
		status: OutboundCallStatus.Ringing,
		preview: {
			name: 'John Doe',
			number: '0671234567',
		},
		isMuted: false,
		cardState: OutboundCallCardState.Ringing,
	},
	{
		id: 'mock-no-answer',
		destination: '0671234567',
		placedCall: {},
		status: OutboundCallStatus.NoAnswer,
		preview: {
			number: '0671234567',
		},
		isMuted: false,
		cardState: OutboundCallCardState.NoAnswer,
	},
];
// TEMP-FIGMA-MOCK end

/**
 * @author Oleksandr Palonnyi
 * The numpad and the outbound call cards are variants of one "Dialer" card in
 * the design, so they share this panel. The numpad stays open beside the cards,
 * since the agent may dial again before the first attempt is answered; an
 * answered call leaves its card for the active call window (AC_16.01.06)
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
const visibleAttempts = computed(() => [
	...mockedAttempts,
	...outboundCallAttemptsStore.attempts.flatMap((attempt) => {
		const cardState = getOutboundCardState(attempt.status);
		return cardState
			? [
					{
						...attempt,
						cardState,
					},
				]
			: [];
	}),
]);

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
.the-dialer-panel {
	position: fixed;
	bottom: var(--spacing-xl);
	left: var(--spacing-xl);
	z-index: 101;
	display: flex;
	align-items: flex-end;
	gap: var(--spacing-xs);
}

.the-dialer-panel__card {
	border-radius: var(--p-border-radius-lg);
	background-color: var(--content-wrapper-color);
	box-shadow: var(--elevation-10);
}
</style>
