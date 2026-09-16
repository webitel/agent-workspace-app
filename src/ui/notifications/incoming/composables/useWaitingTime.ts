import {
	computed,
	type MaybeRefOrGetter,
	onScopeDispose,
	ref,
	toValue,
} from 'vue';

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

function formatDuration(totalSeconds: number): string {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	const mm = String(minutes).padStart(2, '0');
	const ss = String(secs).padStart(2, '0');

	return hours ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function useWaitingTime(
	waitingSince: MaybeRefOrGetter<number>,
	maxWaitSec: MaybeRefOrGetter<number | undefined>,
) {
	const now = ref(Date.now());

	const interval = setInterval(() => {
		now.value = Date.now();
	}, TICK_MS);

	onScopeDispose(() => {
		clearInterval(interval);
	});

	const elapsedSec = computed(() => {
		const since = toValue(waitingSince);
		if (!since) return 0;
		return Math.max(0, Math.floor((now.value - since) / 1000));
	});

	const formatted = computed(() => formatDuration(elapsedSec.value));

	/**
	 * Undefined until the backend exposes the queue's Max wait time (WS-16 /
	 * WS-35). The consumer hides the bar and keeps the counter.
	 */
	const progress = computed(() => {
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
		elapsedSec,
		formatted,
		progress,
		level,
	};
}
