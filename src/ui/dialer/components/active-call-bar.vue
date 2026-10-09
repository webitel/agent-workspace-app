<template>
	<div
		ref="root"
		class="active-call-bar"
	>
		<div
			v-if="expanded"
			class="active-call-bar__card"
		>
			<task-top-bar
				:name="preview.name"
				:subtitle="preview.number"
			>
				<template #status>
					<wt-chip :color="statusChipColor">
						{{ statusLabel }}
					</wt-chip>
					<span class="active-call-bar__timer typo-body-2">
						{{ timer.formatted.value }}
					</span>
				</template>
			</task-top-bar>

			<p
				v-if="preview.queueName"
				class="active-call-bar__queue typo-caption"
			>
				{{ t('ui.notifications.offer.queue') }}: {{ preview.queueName }}
			</p>

			<active-call-numpad
				v-if="isNumpadOpen"
				@digit="emit('sendDigit', $event)"
			/>

			<div class="active-call-bar__actions">
				<wt-icon-btn
					icon="numpad"
					size="sm"
					:color="isNumpadOpen ? IconColor.ACTIVE : IconColor.DEFAULT"
					@click="isNumpadOpen = !isNumpadOpen"
				/>
				<wt-icon-btn
					:icon="preview.isMuted ? 'mic-muted' : 'mic'"
					size="sm"
					@click="emit('toggleMute')"
				/>
				<wt-icon-btn
					icon="hold"
					size="sm"
					:color="preview.isHold ? IconColor.ACTIVE : IconColor.DEFAULT"
					@click="emit('toggleHold')"
				/>
				<wt-icon-btn
					icon="expand"
					size="sm"
				/>
				<wt-icon-btn
					icon="call-transfer"
					size="sm"
				/>
				<wt-icon-btn
					icon="call-end"
					size="sm"
					color="error"
					@click="emit('hangup')"
				/>
			</div>
		</div>

		<div
			v-else
			role="button"
			tabindex="0"
			class="active-call-bar__pill"
			:class="{
				'active-call-bar__pill--hold': preview.isHold,
			}"
			@click="emit('toggleExpand')"
			@keydown.enter.self="emit('toggleExpand')"
		>
			<wt-avatar
				:username="preview.name"
				size="xs"
			/>
			<span class="active-call-bar__pill-status typo-body-2-bold">
				{{ statusLabel }}
			</span>
			<span class="active-call-bar__timer typo-body-2">
				{{ timer.formatted.value }}
			</span>
			<wt-icon-btn
				icon="expand"
				size="sm"
				:color="IconColor.ON_PRIMARY"
				@click.stop
			/>
		</div>
	</div>
</template>

<script
	setup
	lang="ts"
>
import { onClickOutside } from '@vueuse/core';
import { WtAvatar, WtChip, WtIconBtn } from '@webitel/ui-sdk/components';
import { ChipColor, IconColor } from '@webitel/ui-sdk/enums';
import { computed, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';

import TaskTopBar from '../../task-top-bar/task-top-bar.vue';
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
</script>

<style scoped>
.active-call-bar {
	position: relative;
}

.active-call-bar__card {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	box-sizing: border-box;
	width: 280px;
	padding: var(--spacing-sm);
	border-radius: var(--p-border-radius-lg);
	background-color: var(--content-wrapper-color);
	box-shadow: var(--elevation-10);
}

.active-call-bar__queue {
	overflow: hidden;
	margin: 0;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.active-call-bar__actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.active-call-bar__pill {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	padding: var(--spacing-2xs) var(--spacing-xs);
	border-radius: var(--p-border-radius-lg);
	background-color: var(--success-color);
	color: var(--success-on-color);
	cursor: pointer;
}

.active-call-bar__pill--hold {
	background-color: var(--warning-color);
	color: var(--warning-on-color);
}
</style>
