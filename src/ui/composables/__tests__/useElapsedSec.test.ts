import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';

import { useElapsedSec } from '../useElapsedSec';

const START = new Date('2026-10-09T12:00:00Z').getTime();

describe('useElapsedSec', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(START);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function setup(since: number | null | undefined) {
		const sinceRef = ref(since);
		const scope = effectScope();
		const elapsedSec = scope.run(() => useElapsedSec(sinceRef));
		if (!elapsedSec) throw new Error('elapsedSec scope did not run');
		return {
			elapsedSec,
			sinceRef,
			scope,
		};
	}

	it('counts whole seconds since the given epoch', () => {
		const { elapsedSec, scope } = setup(START - 65_900);

		expect(elapsedSec.value).toBe(65);
		scope.stop();
	});

	it('grows as the clock ticks', () => {
		const { elapsedSec, scope } = setup(START);

		vi.advanceTimersByTime(3000);

		expect(elapsedSec.value).toBe(3);
		scope.stop();
	});

	it('is zero when there is no epoch', () => {
		const { elapsedSec, scope } = setup(undefined);

		expect(elapsedSec.value).toBe(0);
		scope.stop();
	});

	it('is never negative when the epoch is in the future', () => {
		const { elapsedSec, scope } = setup(START + 5000);

		expect(elapsedSec.value).toBe(0);
		scope.stop();
	});

	it('restarts when the epoch changes', async () => {
		const { elapsedSec, sinceRef, scope } = setup(START - 65_000);

		sinceRef.value = START;
		await nextTick();

		expect(elapsedSec.value).toBe(0);
		scope.stop();
	});
});
