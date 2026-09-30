<template>
	<div class="chat-top-bar-timer">
		<span
			:class="`chat-top-bar-timer__time--${tone}`"
			class="chat-top-bar-timer__time typo-body-1-bold"
		>
			{{ timeLeft }}
		</span>
		<wt-tooltip placement="bottom-end">
			<template #activator>
				<div class="chat-top-bar-timer__renew">
					<wt-icon-btn
						:disabled="!canRenew"
						:aria-label="t('ui.pages.chats.topBar.extend')"
						icon="plus"
						size="sm"
						@click="processing.renew()"
					/>
				</div>
			</template>
			{{
				t('ui.pages.chats.topBar.extensionsLeft', {
					count: processing.remainingProlongations,
				})
			}}
		</wt-tooltip>
	</div>
</template>

<script setup lang="ts">
import { useNow } from '@vueuse/core';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Task } from 'webitel-sdk';
import { useProcessingStore } from '../../../processing/store/processing';
import { getPostProcessingTone } from '../../../processing/utils/postProcessingTone';

const props = defineProps<{
	task: Task;
}>();

const { t } = useI18n();

const processing = computed(() => useProcessingStore(props.task));

// `useNow` owns the ticking clock and stops it with the component
const now = useNow({
	interval: 1000,
});

const secondsLeft = computed(() =>
	Math.max(
		0,
		Math.floor(
			((processing.value.processingTimeoutAt ?? 0) - now.value.getTime()) /
				1000,
		),
	),
);

// DES-711 shows `00:59`: no hours segment for a phase measured in minutes
const timeLeft = computed(() =>
	convertDuration(secondsLeft.value, {
		alwaysShowHours: false,
	}),
);

const tone = computed(() =>
	getPostProcessingTone(secondsLeft.value, processing.value.processingTotalSec),
);

// The queue opens the renewal window only for the last `renewalSec` seconds,
// and only while it still has prolongations to give.
const canRenew = computed(() => {
	const { renewalSec, remainingProlongations } = processing.value;
	return (
		remainingProlongations > 0 &&
		renewalSec !== null &&
		secondsLeft.value <= renewalSec
	);
});
</script>

<style scoped>
.chat-top-bar-timer {
	display: inline-flex;
	align-items: center;
	gap: var(--spacing-2xs);
}

.chat-top-bar-timer__time {
	font-variant-numeric: tabular-nums;
}

.chat-top-bar-timer__time--success {
	color: var(--success-color);
}

.chat-top-bar-timer__time--warning {
	color: var(--warning-color);
}

.chat-top-bar-timer__time--error {
	color: var(--error-color);
}
</style>
