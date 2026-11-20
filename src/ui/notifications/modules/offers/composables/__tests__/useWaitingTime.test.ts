import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';

import { useWaitingTime, WaitingLevel } from '../useWaitingTime';

/** `onScopeDispose` needs an owning scope, and it lets us assert timer cleanup. */
function withScope<T>(fn: () => T): [
	T,
	() => void,
] {
	const scope = effectScope();
	const result = scope.run(fn) as T;
	return [
		result,
		() => scope.stop(),
	];
}

describe('useWaitingTime', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-09-16T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('counts up from the absolute start time', () => {
		const since = Date.now() - 65_000;
		const [{ elapsedSec, formatted }, stop] = withScope(() =>
			useWaitingTime(since, undefined),
		);

		expect(elapsedSec.value).toBe(65);
		expect(formatted.value).toBe('01:05');

		vi.advanceTimersByTime(5000);
		expect(elapsedSec.value).toBe(70);
		expect(formatted.value).toBe('01:10');

		stop();
	});

	it('counts down from the supplied accept timeout', () => {
		const since = Date.now() - 5_000;
		const [{ formatted }, stop] = withScope(() =>
			useWaitingTime(since, 20, true),
		);

		expect(formatted.value).toBe('00:15');

		vi.advanceTimersByTime(20_000);
		expect(formatted.value).toBe('00:00');

		stop();
	});

	it('grows an hours segment once the wait passes an hour', () => {
		const [{ formatted }, stop] = withScope(() =>
			useWaitingTime(Date.now() - 3_725_000, undefined),
		);

		expect(formatted.value).toBe('01:02:05');
		stop();
	});

	/** A timer without a trustworthy start epoch must stay hidden. */
	it('reports no waiting time when the producer has no epoch', () => {
		const [{ hasWaitingTime, elapsedSec, progress, level }, stop] = withScope(
			() => useWaitingTime(undefined, 100),
		);

		expect(hasWaitingTime.value).toBe(false);
		expect(elapsedSec.value).toBe(0);
		expect(progress.value).toBeUndefined();
		expect(level.value).toBeUndefined();

		stop();
	});

	it('reports a waiting time once an epoch is present', () => {
		const [{ hasWaitingTime }, stop] = withScope(() =>
			useWaitingTime(Date.now(), undefined),
		);

		expect(hasWaitingTime.value).toBe(true);
		stop();
	});

	// without a queue limit, an elapsed timer still renders without the bar
	it('reports no progress when there is no max wait time', () => {
		const [{ progress, level }, stop] = withScope(() =>
			useWaitingTime(Date.now(), undefined),
		);

		expect(progress.value).toBeUndefined();
		expect(level.value).toBeUndefined();
		stop();
	});

	it('walks green -> yellow -> red as the wait approaches the maximum', () => {
		const since = ref(Date.now());
		const [{ progress, level }, stop] = withScope(() =>
			useWaitingTime(() => since.value, 100),
		);

		vi.advanceTimersByTime(10_000);
		expect(progress.value).toBe(10);
		expect(level.value).toBe(WaitingLevel.Low);

		vi.advanceTimersByTime(40_000);
		expect(progress.value).toBe(50);
		expect(level.value).toBe(WaitingLevel.Medium);

		vi.advanceTimersByTime(30_000);
		expect(progress.value).toBe(80);
		expect(level.value).toBe(WaitingLevel.High);

		stop();
	});

	it('clamps progress at 100% once the maximum is exceeded', () => {
		const [{ progress, level }, stop] = withScope(() =>
			useWaitingTime(Date.now() - 500_000, 100),
		);

		expect(progress.value).toBe(100);
		expect(level.value).toBe(WaitingLevel.High);
		stop();
	});

	it('stops ticking when the scope is disposed', () => {
		const [{ elapsedSec }, stop] = withScope(() =>
			useWaitingTime(Date.now(), undefined),
		);

		stop();
		vi.advanceTimersByTime(10_000);

		expect(elapsedSec.value).toBe(0);
	});
});
