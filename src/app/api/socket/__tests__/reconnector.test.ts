import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createReconnector } from '../utils/reconnector';

describe('createReconnector', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('retries with exponential backoff, capped at maxDelay', async () => {
		const reconnect = vi.fn().mockRejectedValue(new Error('fail'));
		const r = createReconnector(reconnect, {
			maxAttempts: 5,
			maxDelay: 5000,
			baseDelay: 1000,
		});

		r.schedule();

		// delays: 1000, 2000, 4000, then capped at 5000, 5000
		await vi.advanceTimersByTimeAsync(1000);
		expect(reconnect).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(2000);
		expect(reconnect).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(4000);
		expect(reconnect).toHaveBeenCalledTimes(3);
		await vi.advanceTimersByTimeAsync(5000);
		expect(reconnect).toHaveBeenCalledTimes(4);
		await vi.advanceTimersByTimeAsync(5000);
		expect(reconnect).toHaveBeenCalledTimes(5);
	});

	it('gives up after maxAttempts', async () => {
		const reconnect = vi.fn().mockRejectedValue(new Error('fail'));
		const r = createReconnector(reconnect, {
			maxAttempts: 2,
			maxDelay: 10000,
			baseDelay: 1000,
		});

		r.schedule();

		await vi.advanceTimersByTimeAsync(1000); // attempt 1
		await vi.advanceTimersByTimeAsync(2000); // attempt 2
		await vi.advanceTimersByTimeAsync(60000); // nothing more scheduled

		expect(reconnect).toHaveBeenCalledTimes(2);
	});

	it('does not schedule overlapping retries', async () => {
		const reconnect = vi.fn().mockRejectedValue(new Error('fail'));
		const r = createReconnector(reconnect, {
			maxAttempts: 5,
			maxDelay: 10000,
			baseDelay: 1000,
		});

		r.schedule();
		r.schedule(); // ignored — a retry is already pending

		await vi.advanceTimersByTimeAsync(1000);
		expect(reconnect).toHaveBeenCalledTimes(1);
	});

	it('resets the backoff after a successful reconnect', async () => {
		const reconnect = vi
			.fn()
			.mockRejectedValueOnce(new Error('fail'))
			.mockResolvedValueOnce(undefined);
		const r = createReconnector(reconnect, {
			maxAttempts: 5,
			maxDelay: 10000,
			baseDelay: 1000,
		});

		r.schedule();
		await vi.advanceTimersByTimeAsync(1000); // attempt 1 fails -> reschedule
		await vi.advanceTimersByTimeAsync(2000); // attempt 2 succeeds -> reset
		expect(reconnect).toHaveBeenCalledTimes(2);

		// next schedule starts from the base delay again (attempts were reset)
		r.schedule();
		await vi.advanceTimersByTimeAsync(999);
		expect(reconnect).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(1);
		expect(reconnect).toHaveBeenCalledTimes(3);
	});

	it('cancel() clears a pending retry', async () => {
		const reconnect = vi.fn().mockRejectedValue(new Error('fail'));
		const r = createReconnector(reconnect, {
			maxAttempts: 5,
			maxDelay: 10000,
			baseDelay: 1000,
		});

		r.schedule();
		r.cancel();

		await vi.advanceTimersByTimeAsync(60000);
		expect(reconnect).not.toHaveBeenCalled();
	});
});
