<template>
    <div
        v-if="hasWaitingTime"
        class="offer-waiting-time"
    >
        <div class="offer-waiting-time__row">
            <span class="typo-caption-bold">
                {{ t(isCountdown
                    ? 'ui.notifications.offer.timeToAccept'
                    : 'ui.notifications.offer.waitingTime') }}
            </span>
            <span class="typo-caption">{{ formatted }}</span>
        </div>
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

import { useWaitingTime } from '../../composables/useWaitingTime';

/** The design draws the queue-wait bar as four discrete segments, not a fill. */
const SEGMENTS = [
	1,
	2,
	3,
	4,
];

/**
 * The timer start and limit, kept raw so the clock stays correct across renders.
 */
const { waitingSince, maxWaitSec, isCountdown } = defineProps<{
	waitingSince?: number;
	maxWaitSec?: number;
	isCountdown?: boolean;
}>();

const { t } = useI18n();

const { hasWaitingTime, formatted, progress, level } = useWaitingTime(
	() => waitingSince,
	() => maxWaitSec,
	() => isCountdown,
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
