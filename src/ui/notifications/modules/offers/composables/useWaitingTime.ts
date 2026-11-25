import { convertDuration } from '@webitel/ui-sdk/scripts';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { useElapsedSec } from '../../../../composables/useElapsedSec';

/**
 * Ticking elapsed queue wait or remaining accept time, plus a progress bar
 * (AC_14.01.04 / AC_06.01.05).
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

export function useWaitingTime(
	waitingSince: MaybeRefOrGetter<number | undefined>,
	maxWaitSec: MaybeRefOrGetter<number | undefined>,
	isCountdown: MaybeRefOrGetter<boolean | undefined> = false,
) {
	/** False when the producer has no usable timer data — the consumer hides the block. */
	const hasWaitingTime = computed(() => {
		if (!toValue(waitingSince)) return false;
		if (!toValue(isCountdown)) return true;

		const max = toValue(maxWaitSec);
		return !!max && max > 0;
	});

	const elapsedSec = useElapsedSec(waitingSince);

	/**
	 * `convertDuration` is what every other live timer in the product uses, so the
	 * formatting stays consistent. The hours segment is dropped below an hour
	 * because DES-727 shows the offer card's timer as `01:22` — a card that lives
	 * for a minute or two should not carry a permanent `00:`.
	 */
	const formattedSec = computed(() => {
		if (toValue(isCountdown)) {
			const acceptTimeoutSec = toValue(maxWaitSec) ?? 0;
			return Math.max(0, acceptTimeoutSec - elapsedSec.value);
		}

		return elapsedSec.value;
	});

	const formatted = computed(() =>
		convertDuration(formattedSec.value, {
			alwaysShowHours: false,
		}),
	);

	/**
	 * For elapsed wait, the denominator is the queue's Max wait time. For a
	 * countdown, it is the chat's accept timeout. Without either limit, the
	 * consumer hides the bar and keeps an elapsed counter.
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
