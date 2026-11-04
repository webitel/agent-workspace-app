import { describe, expect, it } from 'vitest';
import type { Call } from 'webitel-sdk';

import { canTransferCall } from '../canTransferCall';

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		answeredAt: 1_700_000_000_000,
		hangupAt: 0,
		allowTransfer: true,
		isHold: false,
		...overrides,
	}) as unknown as Call;

describe('canTransferCall', () => {
	it('is true for a connected call the backend lets be transferred', () => {
		expect(canTransferCall(buildCall())).toBe(true);
	});

	it('is true for a connected call on hold', () => {
		expect(
			canTransferCall(
				buildCall({
					isHold: true,
				}),
			),
		).toBe(true);
	});

	it('is false when the backend does not allow the transfer', () => {
		expect(
			canTransferCall(
				buildCall({
					allowTransfer: false,
				}),
			),
		).toBe(false);
	});

	it('is false for a call nobody answered yet', () => {
		expect(
			canTransferCall(
				buildCall({
					answeredAt: 0,
				}),
			),
		).toBe(false);
	});

	it('is false once the call ended', () => {
		expect(
			canTransferCall(
				buildCall({
					hangupAt: 1_700_000_100_000,
				}),
			),
		).toBe(false);
	});

	it('is false when there is no call', () => {
		expect(canTransferCall(undefined)).toBe(false);
	});
});
