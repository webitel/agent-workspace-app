<template>
    <!-- hidden outright when the channel has no trustworthy epoch (WS-35) -->
    <div
        v-if="hasWaitingTime"
        class="offer-waiting-time"
    >
        <div class="offer-waiting-time__row">
            <span class="typo-caption-bold">{{ t('ui.notifications.offer.waitingTime') }}</span>
            <span class="typo-caption">{{ formatted }}</span>
        </div>
        <!-- hidden until the backend exposes the queue Max wait time (WS-16 / WS-35) -->
        <div
            v-if="progress !== undefined"
            class="offer-waiting-time__track"
        >
            <span
                v-for="segment in SEGMENTS"
                :key="segment"
                class="offer-waiting-time__segment"
                :class="segment <= filledSegments
                    ? `offer-waiting-time__segment--${level}`
                    : undefined"
            />
        </div>
    </div>
</template>

<script
    setup
    lang="ts"
>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useWaitingTime } from '../composables/useWaitingTime';

/** The design draws the queue-wait bar as four discrete segments, not a fill. */
const SEGMENTS = [
	1,
	2,
	3,
	4,
];

/**
 * How long the customer has been waiting, and how close that is to the queue's
 * limit. Takes the raw epoch rather than a formatted string so the clock lives
 * with the thing that shows it.
 */
const { waitingSince, maxWaitSec } = defineProps<{
	waitingSince?: number;
	maxWaitSec?: number;
}>();

const { t } = useI18n();

const { hasWaitingTime, formatted, progress, level } = useWaitingTime(
	() => waitingSince,
	() => maxWaitSec,
);

const filledSegments = computed(() =>
	progress.value === undefined
		? 0
		: Math.ceil((progress.value / 100) * SEGMENTS.length),
);
</script>

<style scoped>
.offer-waiting-time {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xs, 4px);
    width: 100%;
}

.offer-waiting-time__row {
    display: flex;
    justify-content: space-between;
    padding: 0 var(--spacing-2xs, 4px);
}

.offer-waiting-time__track {
    display: flex;
    gap: 0;
    width: 100%;
    height: 2px;
}

.offer-waiting-time__segment {
    flex: 1 0 0;
    min-width: 0;
    background-color: var(--secondary-color, #d1d5e0);
    transition: background-color 0.3s ease;
}

.offer-waiting-time__segment--low {
    background-color: var(--success-color);
}

.offer-waiting-time__segment--medium {
    background-color: var(--warning-color);
}

.offer-waiting-time__segment--high {
    background-color: var(--error-color);
}
</style>
