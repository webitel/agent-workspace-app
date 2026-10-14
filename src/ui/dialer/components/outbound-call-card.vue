<template>
	<div class="outbound-call-card">
		<div class="outbound-call-card__identity">
			<wt-avatar
				:username="preview.name"
				:size="ComponentSize.LG"
			/>
			<span
				v-if="preview.name"
				class="outbound-call-card__name typo-body-2-bold"
			>
				{{ preview.name }}
			</span>
		</div>

		<div class="outbound-call-card__destination">
			<span class="outbound-call-card__number typo-heading-4">
				{{ preview.number }}
			</span>
			<wt-chip :color="statusChipColor">
				{{ statusLabel }}
			</wt-chip>
		</div>

		<div
			class="outbound-call-card__feedback"
			:class="{
				'outbound-call-card__feedback--fill': isRinging,
			}"
		>
			<ringing-indicator v-if="isRinging" />
			<template v-else>
				<div class="outbound-call-card__no-answer-icon">
					<wt-icon
						icon="wt-call-no-answer"
						:color="IconColor.WARNING"
						aria-hidden="true"
					/>
				</div>
				<p class="outbound-call-card__no-answer-text typo-caption">
					{{ t('ui.call.outboundCall.noAnswerDescription') }}
				</p>
			</template>
		</div>

		<div
			v-if="isRinging"
			class="outbound-call-card__actions"
		>
			<wt-icon-btn
				:icon="isMuted ? 'mic-muted' : 'mic'"
				:disabled="!canToggleMute"
				:size="ComponentSize.SM"
				@click="emit('toggleMute')"
			/>
			<wt-icon-btn
				icon="call-end"
				:color="ButtonColor.ERROR"
				:size="ComponentSize.SM"
				@click="emit('hangup')"
			/>
		</div>
		<template v-else>
			<wt-button
				:color="ButtonColor.SUCCESS"
				:size="ComponentSize.SM"
				wide
				@click="emit('retry')"
			>
				{{ t('ui.call.outboundCall.retryCall') }}
			</wt-button>
			<wt-button
				:color="ButtonColor.SECONDARY"
				:variant="ButtonVariant.OUTLINED"
				:size="ComponentSize.SM"
				wide
				@click="emit('backToDialpad')"
			>
				{{ t('ui.call.outboundCall.backToDialpad') }}
			</wt-button>
		</template>
	</div>
</template>

<script
	setup
	lang="ts"
>
import {
	WtAvatar,
	WtButton,
	WtChip,
	WtIconBtn,
} from '@webitel/ui-sdk/components';
import {
	ButtonColor,
	ButtonVariant,
	ChipColor,
	ComponentSize,
	IconColor,
} from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { OutboundCallStatus } from '../../../features/calls/enums/OutboundCallStatus.enum';
import type { OutboundCallPreview } from '../types/OutboundCallPreview.types';
import RingingIndicator from './ringing-indicator.vue';

const props = defineProps<{
	preview: OutboundCallPreview;
	status: OutboundCallStatus;
	isMuted: boolean;
	canToggleMute: boolean;
}>();

const emit = defineEmits<{
	toggleMute: [];
	hangup: [];
	retry: [];
	backToDialpad: [];
}>();

const { t } = useI18n();

/**
 * @author Oleksandr Palonnyi
 * Dialing reads as Ringing to the agent: the card has no separate dialing look
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
const isRinging = computed(
	() =>
		props.status === OutboundCallStatus.Dialing ||
		props.status === OutboundCallStatus.Ringing,
);

const statusLabel = computed(() =>
	isRinging.value
		? t('ui.call.outboundCall.ringing')
		: t('ui.call.outboundCall.noAnswer'),
);

/**
 * @author Oleksandr Palonnyi
 * The design uses light "success" / "warning" chip tints; the installed
 * `wt-chip` renders these colors as solid fills and has no tint variant, so the
 * chip is the closest library match until the design system adds one.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
const statusChipColor = computed(() =>
	isRinging.value ? ChipColor.SUCCESS : ChipColor.WARNING,
);
</script>

<style scoped>
.outbound-call-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--wt-ws-dialer-sizes-root-gap);
	box-sizing: border-box;
	width: 280px;
	min-height: 436px;
	padding: var(--wt-ws-dialer-sizes-root-padding-y)
		var(--wt-ws-dialer-sizes-root-padding-x);
	border-radius: var(--wt-ws-dialer-sizes-root-border-radius);
	background-color: var(--wt-ws-dialer-colors-root-background);
}

.outbound-call-card__identity,
.outbound-call-card__destination {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--wt-ws-client-identity-block-sizes-root-gap-y);
	width: 100%;
	text-align: center;
}

.outbound-call-card__number {
	overflow-wrap: anywhere;
}

.outbound-call-card__feedback {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--wt-ws-dialer-sizes-connection-feedback-block-gap);
	box-sizing: border-box;
	width: 100%;
	padding: var(--wt-ws-dialer-sizes-connection-feedback-block-padding-y)
		var(--wt-ws-dialer-sizes-connection-feedback-block-padding-x);
	border: 1px solid var(--wt-ws-dialer-colors-connection-feedback-block-border);
	border-radius: var(--wt-ws-dialer-sizes-connection-feedback-block-border-radius);
}

.outbound-call-card__feedback--fill {
	flex: 1 0 0;
}

.outbound-call-card__no-answer-icon {
	display: flex;
	padding: var(--wt-ws-dialer-sizes-connection-feedback-block-call-status-indicator-padding-y)
		var(--wt-ws-dialer-sizes-connection-feedback-block-call-status-indicator-padding-x);
	border-radius: var(--wt-ws-dialer-sizes-connection-feedback-block-call-status-indicator-border-radius);
	background-color: var(--wt-ws-dialer-colors-connection-feedback-block-call-status-indicator-warning-background);
}

.outbound-call-card__no-answer-text {
	margin: 0;
	text-align: center;
}

.outbound-call-card__actions {
	display: flex;
	align-items: flex-end;
	justify-content: center;
	gap: var(--spacing-xs);
	width: 100%;
}
</style>
