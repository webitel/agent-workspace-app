<template>
	<div :class="['call-info-panel-header', `call-info-panel-header--${tone}`]">
		<span class="call-info-panel-header__icon">
			<wt-icon
				:icon="icon"
				:color="tone"
				:size="ComponentSize.SM"
			/>
		</span>
		<div class="call-info-panel-header__heading">
			<span class="call-info-panel-header__title typo-body-1-bold">
				{{ title }}
			</span>
			<span
				v-if="startedAt"
				class="call-info-panel-header__started-at typo-body-1"
			>
				{{ startedAt }}
			</span>
		</div>
		<span
			v-if="answeredAt"
			class="call-info-panel-header__timer typo-heading-6"
		>
			{{ duration }}
		</span>
	</div>
</template>

<script setup lang="ts">
import {
	ComponentSize,
	FormatDateMode,
	type IconColor,
} from '@webitel/ui-sdk/enums';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { formatDate } from '@webitel/ui-sdk/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useElapsedSec } from '../../../../ui/composables/useElapsedSec';

const props = defineProps<{
	icon: string;
	tone: IconColor;
	title: string;
	createdAt?: number;
	answeredAt?: number;
}>();

const { t } = useI18n();

const startedAt = computed(() =>
	props.createdAt
		? `${t('ui.reusable.startedAt')}: ${formatDate(props.createdAt, FormatDateMode.TIME_SEC)}`
		: undefined,
);

// Same format as the call dock's timer: hours always shown.
const elapsedSec = useElapsedSec(() => props.answeredAt);
const duration = computed(() => convertDuration(elapsedSec.value));
</script>

<style scoped>
.call-info-panel-header {
	display: flex;
	align-items: flex-start;
	gap: var(--spacing-xs);
	padding-top: var(--spacing-xs);
	border-top: 4px solid transparent;
}

/* the tone colors the bar on top and the box behind the icon */
.call-info-panel-header--success {
	border-top-color: var(--success-color);
}

.call-info-panel-header--success .call-info-panel-header__icon {
	background: var(--success-on-color);
}

.call-info-panel-header__icon {
	display: inline-flex;
	flex: none;
	padding: var(--spacing-xs);
	border-radius: var(--border-radius);
}

.call-info-panel-header__heading {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: var(--spacing-2xs);
	min-width: 0;
}

.call-info-panel-header__timer {
	flex: none;
}
</style>
