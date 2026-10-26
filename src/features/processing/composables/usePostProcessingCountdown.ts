import { useNow } from '@vueuse/core';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import type { Task } from 'webitel-sdk';
import { useProcessingStore } from '../store/processing';

/**
 * The time left of a task's post-processing, ticking every second for as long
 * as the caller's scope lives. Shared by the window's timer and the call dock's
 * pill, so both read the same deadline the same way.
 */
export function usePostProcessingCountdown(task: MaybeRefOrGetter<Task>) {
	const processing = computed(() => useProcessingStore(toValue(task)));

	// `useNow` owns the ticking clock and stops it with the caller's scope
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

	return {
		processing,
		secondsLeft,
		timeLeft,
	};
}
