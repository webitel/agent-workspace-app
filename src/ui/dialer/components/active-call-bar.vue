<template>
	<div
		ref="root"
		class="active-call-bar"
		:class="{
			'active-call-bar--expanded': expanded,
		}"
	>
		<slide-up-overlay :is-open="expanded">
			<div class="active-call-bar__card">
				<header class="active-call-bar__identity">
					<wt-avatar
						:username="preview.name"
						:size="ComponentSize.SM"
					/>

					<div class="active-call-bar__identity-info">
						<span class="active-call-bar__identity-name typo-body-2-bold">
							{{ preview.name || t('ui.notifications.offer.unknownContact') }}
						</span>

						<span
							v-if="preview.number"
							class="active-call-bar__identity-number typo-caption"
						>
							{{ preview.number }}
						</span>
					</div>

					<wt-button
						:size="ComponentSize.SM"
						color="secondary"
						variant="text"
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
					class="active-call-bar__queue typo-caption"
				>
					<span class="typo-caption-bold">
						{{ t('ui.notifications.offer.queue') }}:
					</span>
					{{ preview.queueName }}
				</p>

				<wt-chip
					class="active-call-bar__status"
					:color="statusChipColor"
				>
					<span>
						{{ statusLabel }}:
					</span>
					<span>
						{{ timer.formatted.value }}
					</span>
				</wt-chip>

				<wt-divider />

				<active-call-numpad
					v-if="isNumpadOpen"
					@digit="emit('sendDigit', $event)"
				/>

				<div class="active-call-bar__actions">
					<wt-button
						:size="ComponentSize.SM"
						color="secondary"
						:variant="getActionVariant(isNumpadOpen)"
						width-by-content
						@click="isNumpadOpen = !isNumpadOpen"
					>
						<wt-icon
							icon="numpad"
							:size="ComponentSize.SM"
							:color="isNumpadOpen ? IconColor.ACTIVE : IconColor.DEFAULT"
						/>
					</wt-button>

					<wt-button
						:size="ComponentSize.SM"
						color="secondary"
						:variant="getActionVariant(preview.isMuted)"
						width-by-content
						@click="emit('toggleMute')"
					>
						<wt-icon
							:icon="preview.isMuted ? 'mic-muted' : 'mic'"
							:size="ComponentSize.SM"
							:color="preview.isMuted ? IconColor.ACTIVE : IconColor.DEFAULT"
						/>
					</wt-button>

					<wt-button
						:size="ComponentSize.SM"
						color="secondary"
						:variant="getActionVariant(preview.isHold)"
						width-by-content
						@click="emit('toggleHold')"
					>
						<wt-icon
							icon="hold"
							:size="ComponentSize.SM"
							:color="preview.isHold ? IconColor.ACTIVE : IconColor.DEFAULT"
						/>
					</wt-button>

					<wt-button
						:size="ComponentSize.SM"
						color="transfer"
						:variant="getActionVariant(isTransferActive)"
						width-by-content
						@click="isTransferActive = !isTransferActive"
					>
						<wt-icon
							icon="call-transfer--filled"
							:size="ComponentSize.SM"
							:color="isTransferActive ? IconColor.ACTIVE : IconColor.TRANSFER"
						/>
					</wt-button>

					<wt-button
						:size="ComponentSize.SM"
						color="error"
						variant="text"
						width-by-content
						@click="emit('hangup')"
					>
						<wt-icon
							icon="call-end--filled"
							:size="ComponentSize.SM"
							:color="IconColor.ERROR"
						/>
					</wt-button>
				</div>
			</div>
		</slide-up-overlay>

		<div
			role="button"
			tabindex="0"
			class="active-call-bar__pill"
			:class="{
				'active-call-bar__pill--hold': preview.isHold,
			}"
			@click="emit('toggleExpand')"
			@keydown.enter.self="emit('toggleExpand')"
		>
			<padded-avatar
				:username="preview.name"
				:size="ComponentSize.XS"
				class="active-call-bar__pill-avatar"
			/>

			<span class="active-call-bar__pill-timer typo-body-1">
				{{ timer.formatted.value }}
			</span>

			<wt-button
				:size="ComponentSize.SM"
				:color="pillButtonColor"
				width-by-content
				@click.stop
			>
				<wt-icon
					icon="ws-open-full-view"
					:size="ComponentSize.SM"
					:color="IconColor.ON_DARK"
				/>
			</wt-button>
		</div>
	</div>
</template>

<script
	setup
	lang="ts"
>
import { onClickOutside } from '@vueuse/core';
import { WtChip, WtDivider } from '@webitel/ui-sdk/components';
import {
	ButtonColor,
	ButtonVariant,
	ChipColor,
	ComponentSize,
	IconColor,
} from '@webitel/ui-sdk/enums';
import { computed, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import PaddedAvatar from '../../components/padded-avatar/padded-avatar.vue';
import SlideUpOverlay from '../../components/slide-up-overlay/slide-up-overlay.vue';
import { useActiveCallTimer } from '../composables/useActiveCallTimer';
import type { ActiveCallPreview } from '../types/ActiveCallPreview.types';
import ActiveCallNumpad from './active-call-numpad.vue';

const props = defineProps<{
	preview: ActiveCallPreview;
	expanded: boolean;
}>();

const emit = defineEmits<{
	toggleExpand: [];
	collapse: [];
	toggleMute: [];
	toggleHold: [];
	hangup: [];
	sendDigit: [
		digit: string,
	];
}>();

const { t } = useI18n();

const root = useTemplateRef<HTMLElement>('root');
const isNumpadOpen = ref(false);

/**
 * @author Oleksandr Palonnyi
 * transfer has no SDK action yet, so its active state is only this local
 * toggle; mute and hold are not mirrored here because the preview already
 * carries their real state
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
const isTransferActive = ref(false);

/**
 * @author Oleksandr Palonnyi
 * wt-button has no active prop, so an active action is marked by switching
 * the button from the text to the filled (ButtonVariant.ACTIVE) variant
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
const getActionVariant = (isActive: boolean): ButtonVariant =>
	isActive ? ButtonVariant.ACTIVE : ButtonVariant.TEXT;

/**
 * @author Oleksandr Palonnyi
 * a click outside the opened card collapses it (AC_14.02.05); the guard keeps
 * the collapsed pill from emitting on every click elsewhere on the page
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
onClickOutside(root, () => {
	if (props.expanded) emit('collapse');
});

const timer = useActiveCallTimer({
	answeredAt: () => props.preview.answeredAt,
	isHold: () => props.preview.isHold,
});

const statusLabel = computed(() =>
	props.preview.isHold
		? t('ui.dialer.activeCall.onHold')
		: t('ui.dialer.activeCall.inCall'),
);

const statusChipColor = computed(() =>
	props.preview.isHold ? ChipColor.WARNING : ChipColor.SUCCESS,
);

const pillButtonColor = computed(() =>
	props.preview.isHold ? ButtonColor.WARN : ButtonColor.SUCCESS,
);
</script>

<style scoped>
.active-call-bar {
	--active-call-bar-card-width: 280px;

	position: relative;
}

.active-call-bar--expanded {
	width: var(--active-call-bar-card-width);
}

.active-call-bar__card {
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

.active-call-bar__identity {
	display: flex;
	align-items: flex-start;
	gap: var(--wt-ws-client-identity-block-sizes-root-gap-x);
	padding: var(--wt-ws-client-identity-block-sizes-root-padding-y)
		var(--wt-ws-client-identity-block-sizes-root-padding-x);
	border-radius: var(--wt-ws-client-identity-block-sizes-root-border-radius);
	background: var(--wt-ws-client-identity-block-colors-root-background);
}

.active-call-bar__identity-info {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: var(--wt-ws-client-identity-block-sizes-root-gap-y);
	min-width: 0;
	color: var(--text-main-color);
}

.active-call-bar__identity-name,
.active-call-bar__identity-number {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.active-call-bar__queue {
	overflow: hidden;
	margin: 0;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.active-call-bar__status {
	align-self: center;
}

.active-call-bar__actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.active-call-bar__pill {
	height: 40px;
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	padding: var(--spacing-2xs);
	border-radius: var(--p-border-radius-lg);
	background-color: var(--wt-ws-call-dock-colors-floating-call-widget-active-background);
	color: var(--wt-ws-call-dock-colors-floating-call-widget-active-color);
	cursor: pointer;
}

.active-call-bar__pill-avatar {
	flex: 0 1 auto;
}

.active-call-bar__pill:hover {
	background-color: var(--wt-ws-call-dock-colors-floating-call-widget-active-hover-background);
}

.active-call-bar__pill-timer {
	width: 50px;
	flex: 0 1 auto;
}

.active-call-bar__pill--hold {
	background-color: var(--wt-ws-call-dock-colors-floating-call-widget-hold-background);
	color: var(--wt-ws-call-dock-colors-floating-call-widget-hold-color);
}

.active-call-bar__pill--hold:hover {
	background-color: var(--wt-ws-call-dock-colors-floating-call-widget-hold-hover-background);
}
</style>
