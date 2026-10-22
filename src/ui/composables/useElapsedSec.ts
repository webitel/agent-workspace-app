import { useNow } from '@vueuse/core';
import {
	type ComputedRef,
	computed,
	type MaybeRefOrGetter,
	toValue,
} from 'vue';

const TICK_MS = 1000;

/**
 * @author Oleksandr Palonnyi
 * the counter derives from an absolute epoch (`since`) instead of adding up
 * ticks, so it stays right across re-renders and tab sleep, and `useNow` stops
 * the clock with the owning scope. an absent `since` reads as zero, which lets
 * the consumer decide separately whether to hide the timer
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
export function useElapsedSec(
	since: MaybeRefOrGetter<number | null | undefined>,
): ComputedRef<number> {
	const now = useNow({
		interval: TICK_MS,
	});

	return computed(() => {
		const sinceMs = toValue(since);
		if (!sinceMs) return 0;
		return Math.max(0, Math.floor((now.value.getTime() - sinceMs) / 1000));
	});
}
