<template>
	<div class="active-call-card">
		<header class="active-call-card__identity">
			<wt-avatar
				:username="preview.name"
				:size="ComponentSize.SM"
			/>

			<div class="active-call-card__identity-info">
				<span class="active-call-card__identity-name typo-body-2-bold">
					{{ preview.name || t('ui.notifications.offer.unknownContact') }}
				</span>

				<span
					v-if="preview.number"
					class="active-call-card__identity-number typo-caption"
				>
					{{ preview.number }}
				</span>
			</div>

			<wt-button
				v-if="preview.isPostProcessingEnabled"
				:size="ComponentSize.SM"
				color="secondary"
				variant="text"
				:aria-label="t('ui.call.activeCall.actions.openFullView')"
				width-by-content
			>
				<wt-icon
					icon="ws-open-full-view"
					:size="ComponentSize.SM"
					:color="IconColor.DEFAULT"
				/>
			</wt-button>
		</header>

		<p
			v-if="preview.queueName"
			class="active-call-card__queue typo-caption"
		>
			<span class="typo-caption-bold">
				{{ t('ui.notifications.offer.queue') }}:
			</span>
			{{ preview.queueName }}
		</p>

		<wt-chip
			class="active-call-card__status"
			:color="statusChipColor"
		>
			<span>
				{{ statusLabel }}:
			</span>
			<span>
				{{ elapsedTime }}
			</span>
		</wt-chip>

		<wt-divider />

		<active-call-numpad
			v-if="isNumpadOpen"
			@digit="emit('sendDigit', $event)"
		/>

		<active-call-actions
			:is-numpad-open="isNumpadOpen"
			:is-muted="preview.isMuted"
			:is-hold="preview.isHold"
			@toggle-numpad="isNumpadOpen = !isNumpadOpen"
			@toggle-mute="emit('toggleMute')"
			@toggle-hold="emit('toggleHold')"
			@hangup="emit('hangup')"
		/>
	</div>
</template>

<script
	setup
	lang="ts"
>
import { WtChip, WtDivider } from '@webitel/ui-sdk/components';
import { ChipColor, ComponentSize, IconColor } from '@webitel/ui-sdk/enums';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ActiveCallPreview } from '../types/ActiveCallPreview.types';
import ActiveCallActions from './active-call-actions.vue';
import ActiveCallNumpad from './active-call-numpad.vue';

const props = defineProps<{
	preview: ActiveCallPreview;
	elapsedTime: string;
}>();

const emit = defineEmits<{
	toggleMute: [];
	toggleHold: [];
	hangup: [];
	sendDigit: [
		digit: string,
	];
}>();

const { t } = useI18n();

/**
 * @author Oleksandr Palonnyi
 * the numpad state lives here and not in the bar: the bar unmounts the card
 * when it collapses, so the numpad comes back closed and with no digits
 * instead of open and empty
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
const isNumpadOpen = ref(false);

const statusLabel = computed(() =>
	props.preview.isHold
		? t('ui.call.activeCall.onHold')
		: t('ui.call.activeCall.inCall'),
);

const statusChipColor = computed(() =>
	props.preview.isHold ? ChipColor.WARNING : ChipColor.SUCCESS,
);
</script>

<style scoped>
.active-call-card {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
	box-sizing: border-box;
	width: var(--active-call-bar-card-width);
	padding: var(--spacing-sm);
	border-radius: var(--wt-ws-call-dock-sizes-root-border-radius)
		var(--wt-ws-call-dock-sizes-root-border-radius) 0 0;
	background-color: var(--wt-ws-call-dock-colors-root-background);
	box-shadow: var(--elevation-10);
}

.active-call-card__identity {
	display: flex;
	align-items: flex-start;
	gap: var(--wt-ws-client-identity-block-sizes-root-gap-x);
	padding: var(--wt-ws-client-identity-block-sizes-root-padding-y)
		var(--wt-ws-client-identity-block-sizes-root-padding-x);
	border-radius: var(--wt-ws-client-identity-block-sizes-root-border-radius);
	background: var(--wt-ws-client-identity-block-colors-root-background);
}

.active-call-card__identity-info {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: var(--wt-ws-client-identity-block-sizes-root-gap-y);
	min-width: 0;
	color: var(--text-main-color);
}

.active-call-card__identity-name,
.active-call-card__identity-number {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.active-call-card__queue {
	overflow: hidden;
	margin: 0;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.active-call-card__status {
	align-self: center;
}
</style>
