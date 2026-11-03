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
import {
	ComponentSize,
	FormatDateMode,
	IconColor,
} from '@webitel/ui-sdk/enums';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { formatDate } from '@webitel/ui-sdk/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { CallDirection } from 'webitel-sdk';

import { useElapsedSec } from '../../../../ui/composables/useElapsedSec';
import { CallPanelInfoField } from '../../enums/CallPanelInfoField.enum';
import type { CallPanelInfo } from '../../types/CallPanelInfo.types';

interface CallPanelInfoView {
	icon: string;
	iconColor: IconColor;
	title: () => string;
	fields: CallPanelInfoField[];
}

interface CallPanelInfoFieldDef {
	label: () => string;
	value: (info: CallPanelInfo) => string | undefined;
}

const props = defineProps<{
	info: CallPanelInfo;
}>();

const { t } = useI18n();

// A direction without an entry shows no block: the outbound one comes with US_16.03.
const viewByDirection: Partial<Record<CallDirection, CallPanelInfoView>> = {
	[CallDirection.Inbound]: {
		icon: 'ws-inbound-call',
		iconColor: IconColor.SUCCESS,
		title: () => t('ui.call.direction.inbound'),
		fields: [
			CallPanelInfoField.From,
			CallPanelInfoField.To,
			CallPanelInfoField.Queue,
		],
	},
};

const fieldDefs: Record<CallPanelInfoField, CallPanelInfoFieldDef> = {
	[CallPanelInfoField.From]: {
		label: () => t('reusable.from'),
		value: ({ from }) => from,
	},
	[CallPanelInfoField.To]: {
		label: () => t('reusable.to'),
		value: ({ to }) => to,
	},
	[CallPanelInfoField.Queue]: {
		label: () => t('objects.queue.queue', 1),
		value: ({ queueName }) => queueName,
	},
};

const view = computed(() =>
	props.info.direction ? viewByDirection[props.info.direction] : undefined,
);

const startedAt = computed(() => {
	const { createdAt } = props.info;
	if (!createdAt) return undefined;
	return `${t('ui.reusable.startedAt')}: ${formatDate(createdAt, FormatDateMode.TIME_SEC)}`;
});

// A field the call does not have is left out rather than shown empty.
const rows = computed(() =>
	(view.value?.fields ?? []).flatMap((field) => {
		const { label, value } = fieldDefs[field];
		const fieldValue = value(props.info);
		return fieldValue
			? [
					{
						field,
						label: label(),
						value: fieldValue,
					},
				]
			: [];
	}),
);

// Same format as the call dock's timer: hours always shown.
const elapsedSec = useElapsedSec(() => props.info.answeredAt);
const duration = computed(() => convertDuration(elapsedSec.value));
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
