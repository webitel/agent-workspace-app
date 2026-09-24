<template>
	<div
		v-if="isShown"
		class="post-processing-chip"
	>
		<span class="typo-body-1-bold">Post-processing</span>
		<span class="post-processing-chip__time typo-body-1">{{ timeLeft }}</span>
		<wt-icon-btn
			:disabled="!canRenew"
			icon="plus"
			@click="processing.renew()"
		/>
	</div>
</template>

<script setup lang="ts">
import { useNow } from '@vueuse/core';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { computed } from 'vue';
import type { Task } from 'webitel-sdk';

import { useProcessingStore } from '../store/processing';

const props = defineProps<{
	task: Task;
}>();

const processing = computed(() => useProcessingStore(props.task));

// `useNow` owns the ticking clock and stops it with the component
const now = useNow({
	interval: 1000,
});

const isShown = computed(
	() =>
		processing.value.isPostProcessing &&
		Boolean(processing.value.processingTimeoutAt),
);

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
.post-processing-chip {
	display: inline-flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.post-processing-chip__time {
	color: var(--success-color);
	font-variant-numeric: tabular-nums;
}
</style>
