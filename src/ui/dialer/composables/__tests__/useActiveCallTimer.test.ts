import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';

import { useActiveCallTimer } from '../useActiveCallTimer';

const START = new Date('2026-10-09T12:00:00Z').getTime();

describe('useActiveCallTimer', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(START);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function setup(isHold = false) {
		const holdState = ref(isHold);
		const scope = effectScope();
		const timer = scope.run(() =>
			useActiveCallTimer({
				answeredAt: START - 65_000,
				isHold: holdState,
			}),
		);
		if (!timer) throw new Error('timer scope did not run');
		return {
			timer,
			holdState,
			scope,
		};
	}

	it('counts the call from the moment it was answered', () => {
		const { timer, scope } = setup();

		expect(timer.elapsedSec.value).toBe(65);
		expect(timer.formatted.value).toBe('01:05');
		scope.stop();
	});

	it('restarts from zero when the call is put on hold', async () => {
		const { timer, holdState, scope } = setup();

		holdState.value = true;
		await nextTick();
		expect(timer.elapsedSec.value).toBe(0);

		vi.advanceTimersByTime(3000);
		expect(timer.elapsedSec.value).toBe(3);
		scope.stop();
	});

	it('goes back to the call time when the hold ends', async () => {
		const { timer, holdState, scope } = setup(true);

		holdState.value = false;
		await nextTick();

		expect(timer.elapsedSec.value).toBe(65);
		scope.stop();
	});
});
