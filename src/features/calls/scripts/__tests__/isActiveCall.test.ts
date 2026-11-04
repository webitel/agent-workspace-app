import { describe, expect, it } from 'vitest';
import type { Call } from 'webitel-sdk';

import { isActiveCall } from '../isActiveCall';

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		answeredAt: 1_700_000_000_000,
		hangupAt: 0,
		...overrides,
	}) as unknown as Call;

describe('isActiveCall', () => {
	it('is true for an answered call that is still running', () => {
		expect(isActiveCall(buildCall())).toBe(true);
	});

	it('is false for a call nobody answered yet', () => {
		expect(
			isActiveCall(
				buildCall({
					answeredAt: 0,
				}),
			),
		).toBe(false);
	});

	it('is false once the call ended', () => {
		expect(
			isActiveCall(
				buildCall({
					hangupAt: 1_700_000_100_000,
				}),
			),
		).toBe(false);
	});

	it('is false without a call', () => {
		expect(isActiveCall(undefined)).toBe(false);
	});
});
