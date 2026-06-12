/**
 * Exponential-backoff reconnect policy: owns the backoff math, retry timer and
 * attempt counter — nothing else. Dependency-free (the manager injects
 * `reconnect`) so there's no import cycle and it's testable with fake timers.
 */

type ReconnectorOptions = {
	maxAttempts: number;
	maxDelay: number;
	/** First-retry delay (ms); doubles each attempt. */
	baseDelay?: number;
};

export type Reconnector = {
	/** Start/continue the backoff loop. No-op while a retry is pending. */
	schedule: () => void;
	/** Reset the attempt counter (after a successful connect). */
	reset: () => void;
	/** Cancel a pending retry and reset. */
	cancel: () => void;
};

export function createReconnector(
	reconnect: () => Promise<void>,
	{ maxAttempts, maxDelay, baseDelay = 1000 }: ReconnectorOptions,
): Reconnector {
	let attempts = 0;
	let timerId: number | null = null;

	function reset() {
		attempts = 0;
	}

	function cancel() {
		if (timerId !== null) {
			clearTimeout(timerId);
			timerId = null;
		}
		reset();
	}

	function schedule() {
		if (timerId !== null || attempts >= maxAttempts) return;

		const delay = Math.min(baseDelay * 2 ** attempts, maxDelay);
		attempts++;

		timerId = window.setTimeout(async () => {
			timerId = null;
			try {
				await reconnect();
				reset();
			} catch {
				schedule();
			}
		}, delay);
	}

	return {
		schedule,
		reset,
		cancel,
	};
}
