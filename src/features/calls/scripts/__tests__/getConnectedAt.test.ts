import { describe, expect, it } from 'vitest';
import type { Call } from 'webitel-sdk';

import { getConnectedAt } from '../getConnectedAt';

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		answeredAt: 0,
		bridgedAt: 0,
		...overrides,
	}) as unknown as Call;

describe('getConnectedAt', () => {
	it('prefers answeredAt when the SDK set it', () => {
		expect(
			getConnectedAt(
				buildCall({
					answeredAt: 100,
					bridgedAt: 200,
				}),
			),
		).toBe(100);
	});

	it('falls back to bridgedAt while answeredAt is still 0', () => {
		expect(
			getConnectedAt(
				buildCall({
					bridgedAt: 200,
				}),
			),
		).toBe(200);
	});

	it('is 0 for a call that has not connected', () => {
		expect(getConnectedAt(buildCall())).toBe(0);
	});
});
