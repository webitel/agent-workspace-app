<template>
	<div class="call-dock">
		<header class="call-dock__identity">
			<wt-avatar
				:username="preview.name"
				:size="ComponentSize.SM"
			/>

			<div class="call-dock__identity-info">
				<span class="call-dock__identity-name typo-body-2-bold">
					{{ preview.name || t('ui.notifications.offer.unknownContact') }}
				</span>

				<span
					v-if="preview.number"
					class="call-dock__identity-number typo-caption"
				>
					{{ preview.number }}
				</span>
			</div>

			<wt-button
				:size="ComponentSize.SM"
				color="secondary"
				variant="text"
				:aria-label="t('ui.call.activeCall.actions.openFullView')"
				width-by-content
				@click="emit('openFullView')"
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
			class="call-dock__queue typo-caption"
		>
			<span class="typo-caption-bold">
				{{ t('ui.notifications.offer.queue') }}:
			</span>
			{{ preview.queueName }}
		</p>

		<wt-chip
			class="call-dock__status"
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

		<call-dock-numpad
			v-if="isNumpadOpen"
			:digits="preview.dtmfDigits"
			@digit="emit('sendDigit', $event)"
		/>

		<call-dock-actions
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
import type { ActiveCallContent } from '../types/ActiveCallContent.types';
import CallDockActions from './call-dock-actions.vue';
import CallDockNumpad from './call-dock-numpad.vue';

const props = defineProps<{
	preview: ActiveCallContent;
	elapsedTime: string;
}>();

const emit = defineEmits<{
	toggleMute: [];
	toggleHold: [];
	hangup: [];
	openFullView: [];
	sendDigit: [
		digit: string,
	];
}>();

const { t } = useI18n();

/**
 * @author Oleksandr Palonnyi
 * the open flag lives here and not in the tray entry: the tray entry unmounts the dock
 * when it collapses, so the numpad comes back closed; its digits are not
 * lost, they come from the call preview
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
.call-dock {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
	box-sizing: border-box;
	width: var(--active-call-tray-entry-dock-width);
	padding: var(--wt-ws-call-dock-sizes-root-padding-x);
	border-radius: var(--wt-ws-call-dock-sizes-root-border-radius)
		var(--wt-ws-call-dock-sizes-root-border-radius) 0 0;
	background-color: var(--wt-ws-call-dock-colors-root-background);
	box-shadow: var(--elevation-10);
}

.call-dock__identity {
	display: flex;
	align-items: flex-start;
	gap: var(--wt-ws-client-identity-block-sizes-root-gap-x);
	padding: var(--wt-ws-client-identity-block-sizes-root-padding-y)
		var(--wt-ws-client-identity-block-sizes-root-padding-x);
	border-radius: var(--wt-ws-client-identity-block-sizes-root-border-radius);
	background: var(--wt-ws-client-identity-block-colors-root-background);
}

.call-dock__identity-info {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: var(--wt-ws-client-identity-block-sizes-root-gap-y);
	min-width: 0;
	color: var(--text-main-color);
}

.call-dock__identity-name,
.call-dock__identity-number {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.call-dock__queue {
	overflow: hidden;
	margin: 0;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.call-dock__status {
	align-self: center;
}
</style>
