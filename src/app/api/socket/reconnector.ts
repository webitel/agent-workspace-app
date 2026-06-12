/* ============================================================================
 * Reconnector
 *
 * Exponential-backoff reconnect policy, decoupled from the socket manager. It
 * owns the backoff math, the retry timer, and the attempt counter — nothing
 * else. It is SDK-agnostic: the manager injects the `reconnect` action and
 * decides *when* to start (on the `disconnected` event); this module only
 * decides *how long to wait* and *when to give up*.
 *
 * Kept dependency-free (no import from the manager) so there is no import
 * cycle and the backoff is unit-testable with fake timers alone.
 * ========================================================================== */

type ReconnectorOptions = {
	maxAttempts: number;
	maxDelay: number;
	/** Base delay in ms for the first retry; doubles each attempt. */
	baseDelay?: number;
};

export type Reconnector = {
	/** Start (or continue) the backoff loop. No-op if a retry is pending. */
	schedule: () => void;
	/** Clear the attempt counter (call after a successful connect). */
	reset: () => void;
	/** Cancel any pending retry and reset the counter. */
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
