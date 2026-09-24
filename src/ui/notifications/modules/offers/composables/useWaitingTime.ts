import { useNow } from '@vueuse/core';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

/**
 * Ticking "waiting time" plus the queue-wait progress bar (AC_14.01.04 /
 * AC_06.01.05).
 *
 * The producer passes an absolute `waitingSince`, not a duration, so the counter
 * stays correct across re-renders and tab sleep without anyone pushing updates.
 */

export const WaitingLevel = {
	Low: 'low',
	Medium: 'medium',
	High: 'high',
} as const;

export type WaitingLevel = (typeof WaitingLevel)[keyof typeof WaitingLevel];

const TICK_MS = 1000;
export function useWaitingTime(
	waitingSince: MaybeRefOrGetter<number | undefined>,
	maxWaitSec: MaybeRefOrGetter<number | undefined>,
) {
	// `useNow` owns the ticking clock and stops it when the scope is disposed
	const now = useNow({
		interval: TICK_MS,
	});

	/** False when the producer has no trustworthy epoch — the consumer hides the block. */
	const hasWaitingTime = computed(() => !!toValue(waitingSince));

	const elapsedSec = computed(() => {
		const since = toValue(waitingSince);
		if (!since) return 0;
		return Math.max(0, Math.floor((now.value.getTime() - since) / 1000));
	});

	/**
	 * `convertDuration` is what every other live timer in the product uses, so the
	 * formatting stays consistent. The hours segment is dropped below an hour
	 * because DES-727 shows the offer card's timer as `01:22` — a card that lives
	 * for a minute or two should not carry a permanent `00:`.
	 */
	const formatted = computed(() =>
		convertDuration(elapsedSec.value, {
			alwaysShowHours: false,
		}),
	);

	/**
	 * Undefined until the backend exposes the queue's Max wait time (WS-16 /
	 * WS-35). The consumer hides the bar and keeps the counter.
	 */
	const progress = computed(() => {
		if (!hasWaitingTime.value) return undefined;
		const max = toValue(maxWaitSec);
		if (!max || max <= 0) return undefined;
		return Math.min(100, (elapsedSec.value / max) * 100);
	});

	const level = computed<WaitingLevel | undefined>(() => {
		if (progress.value === undefined) return undefined;
		if (progress.value <= 33) return WaitingLevel.Low;
		if (progress.value <= 66) return WaitingLevel.Medium;
		return WaitingLevel.High;
	});

	return {
		hasWaitingTime,
		elapsedSec,
		formatted,
		progress,
		level,
	};
}
