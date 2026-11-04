import { describe, expect, it } from 'vitest';
import { type Call, CallDirection } from 'webitel-sdk';

import { isCallAudible } from '../isCallAudible';

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		direction: CallDirection.Inbound,
		allowAnswer: false,
		isEavesdrop: false,
		queue: null,
		params: {},
		isHold: false,
		answeredAt: 1_700_000_000_000,
		hangupAt: 0,
		...overrides,
	}) as unknown as Call;

describe('isCallAudible', () => {
	it('is true for a connected call', () => {
		expect(isCallAudible(buildCall())).toBe(true);
	});

	it('is false for a connected call on hold', () => {
		expect(
			isCallAudible(
				buildCall({
					isHold: true,
				}),
			),
		).toBe(false);
	});

	it("is true for the agent's own dial that is still ringing back", () => {
		expect(
			isCallAudible(
				buildCall({
					direction: CallDirection.Outbound,
					answeredAt: 0,
				}),
			),
		).toBe(true);
	});

	it('is false for an incoming call that is still an offer', () => {
		expect(
			isCallAudible(
				buildCall({
					allowAnswer: true,
					answeredAt: 0,
				}),
			),
		).toBe(false);
	});

	/** The platform rings the agent's own device first: that leg is an offer. */
	it('is false for an outbound leg that waits for the agent to answer', () => {
		expect(
			isCallAudible(
				buildCall({
					direction: CallDirection.Outbound,
					allowAnswer: true,
					params: {
						autoAnswer: false,
					},
					answeredAt: 0,
				} as Partial<Call>),
			),
		).toBe(false);
	});

	it.each([
		CallDirection.Inbound,
		CallDirection.Outbound,
	])('is false once a %s call ended', (direction) => {
		expect(
			isCallAudible(
				buildCall({
					direction,
					hangupAt: 1_700_000_100_000,
				}),
			),
		).toBe(false);
	});

	it('is false without a call', () => {
		expect(isCallAudible(undefined)).toBe(false);
	});
});
