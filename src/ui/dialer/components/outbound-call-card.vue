<template>
	<div class="outbound-call-card">
		<div class="outbound-call-card__identity">
			<wt-avatar
				:username="preview.name"
				size="lg"
			/>
			<span
				v-if="preview.name"
				class="outbound-call-card__name typo-body-1-bold"
			>
				{{ preview.name }}
			</span>
		</div>

		<div class="outbound-call-card__destination">
			<span class="outbound-call-card__number typo-heading-3">
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
					<span class="outbound-call-card__icon-placeholder" />
				</div>
				<p class="outbound-call-card__no-answer-text typo-caption">
					{{ t('ui.dialer.outboundCall.noAnswerDescription') }}
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
				size="sm"
				@click="emit('toggleMute')"
			/>
			<wt-icon-btn
				icon="call-end"
				color="error"
				size="sm"
				@click="emit('hangup')"
			/>
		</div>
		<template v-else>
			<wt-button
				color="success"
				size="sm"
				wide
				@click="emit('retry')"
			>
				{{ t('ui.dialer.outboundCall.retryCall') }}
			</wt-button>
			<wt-button
				color="secondary"
				variant="outlined"
				size="sm"
				wide
				@click="emit('backToDialpad')"
			>
				{{ t('ui.dialer.outboundCall.backToDialpad') }}
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
import { ChipColor } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { OutboundCallCardState } from '../enums/OutboundCallCardState.enum';
import type { OutboundCallPreview } from '../types/OutboundCallPreview.types';
import RingingIndicator from './ringing-indicator.vue';

const props = defineProps<{
	preview: OutboundCallPreview;
	state: OutboundCallCardState;
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

const isRinging = computed(() => props.state === OutboundCallCardState.Ringing);

const statusLabel = computed(() =>
	isRinging.value
		? t('ui.dialer.outboundCall.ringing')
		: t('ui.dialer.outboundCall.noAnswer'),
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
	gap: var(--spacing-xs);
	box-sizing: border-box;
	width: 280px;
	min-height: 436px;
	padding: var(--spacing-sm);
}

.outbound-call-card__identity,
.outbound-call-card__destination {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--spacing-2xs);
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
	gap: var(--spacing-sm);
	box-sizing: border-box;
	width: 100%;
	padding: var(--spacing-lg);
	border: 1px solid var(--divider-border-color);
	border-radius: var(--spacing-xs);
}

.outbound-call-card__feedback--fill {
	flex: 1 0 0;
}

.outbound-call-card__no-answer-icon {
	display: flex;
	padding: var(--spacing-sm);
	border-radius: 50%;
	background-color: var(--warning-light-color);
}

/**
 * @author Oleksandr Palonnyi
 * Reserves the 24px slot of the "Call Status Indicator / NoAnswer" icon
 * (Figma, Dialer DES-721) until the icon is added; the ui-sdk sprite has none.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
.outbound-call-card__icon-placeholder {
	display: block;
	width: 24px;
	height: 24px;
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
