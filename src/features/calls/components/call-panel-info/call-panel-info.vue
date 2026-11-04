<template>
	<section
		v-if="view"
		:class="[
			'call-panel-info',
			`call-panel-info--${view.iconColor}`,
		]"
	>
		<div class="call-panel-info__header">
			<span class="call-panel-info__icon">
				<wt-icon
					:icon="view.icon"
					:color="view.iconColor"
					:size="ComponentSize.SM"
				/>
			</span>
			<div class="call-panel-info__heading">
				<span class="call-panel-info__title typo-body-1-bold">
					{{ view.title() }}
				</span>
				<span
					v-if="startedAt"
					class="call-panel-info__started-at typo-body-1"
				>
					{{ startedAt }}
				</span>
			</div>
			<span
				v-if="info.answeredAt"
				class="call-panel-info__timer typo-heading-6"
			>
				{{ duration }}
			</span>
		</div>
		<wt-divider />
		<dl class="call-panel-info__fields">
			<div
				v-for="row in rows"
				:key="row.field"
				class="call-panel-info__row"
			>
				<dt class="call-panel-info__label typo-caption-bold">{{ row.label }}:</dt>
				<dd class="call-panel-info__value typo-caption">{{ row.value }}</dd>
			</div>
		</dl>
	</section>
</template>

<script setup lang="ts">
import { WtDivider } from '@webitel/ui-sdk/components';
import { ComponentSize } from '@webitel/ui-sdk/enums';

import { useCallPanelInfo } from '../../composables/useCallPanelInfo';
import type { CallPanelInfo } from '../../types/CallPanelInfo.types';

const props = defineProps<{
	info: CallPanelInfo;
}>();

const { view, rows, startedAt, duration } = useCallPanelInfo(() => props.info);
</script>

<style scoped>
.call-panel-info {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	padding-top: var(--spacing-xs);
	border-top: 4px solid transparent;
}

/* the tone follows the icon's color: the bar takes the tone, the icon box its "on" color */
.call-panel-info--success {
	border-top-color: var(--success-color);
}

.call-panel-info--success .call-panel-info__icon {
	background: var(--success-on-color);
}

.call-panel-info__header {
	display: flex;
	align-items: flex-start;
	gap: var(--spacing-xs);
}

.call-panel-info__icon {
	display: inline-flex;
	flex: none;
	padding: var(--spacing-xs);
	border-radius: var(--border-radius);
}

.call-panel-info__heading {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: var(--spacing-2xs);
	min-width: 0;
}

.call-panel-info__timer {
	flex: none;
}

.call-panel-info__fields {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	margin: 0;
}

.call-panel-info__row {
	display: flex;
	gap: var(--spacing-2xs);
	min-width: 0;
}

.call-panel-info__label {
	flex: none;
}

.call-panel-info__value {
	margin: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
