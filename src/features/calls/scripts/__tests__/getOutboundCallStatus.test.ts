import { describe, expect, it } from 'vitest';
import type { Call } from 'webitel-sdk';

import { OutboundCallStatus } from '../../enums/OutboundCallStatus.enum';
import { getOutboundCallStatus } from '../getOutboundCallStatus';

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		answeredAt: 0,
		hangupAt: 0,
		...overrides,
	}) as unknown as Call;

describe('getOutboundCallStatus', () => {
	it('is dialing until the platform reports the call', () => {
		expect(getOutboundCallStatus(null)).toBe(OutboundCallStatus.Dialing);
	});

	it('is ringing while the callee has not picked up', () => {
		expect(getOutboundCallStatus(buildCall())).toBe(OutboundCallStatus.Ringing);
	});

	it('is answered once the call went active', () => {
		expect(
			getOutboundCallStatus(
				buildCall({
					answeredAt: 1000,
				}),
			),
		).toBe(OutboundCallStatus.Answered);
	});

	it('is no answer when the call ended before being answered', () => {
		expect(
			getOutboundCallStatus(
				buildCall({
					hangupAt: 2000,
				}),
			),
		).toBe(OutboundCallStatus.NoAnswer);
	});

	it('is ended when an answered call hangs up', () => {
		expect(
			getOutboundCallStatus(
				buildCall({
					answeredAt: 1000,
					hangupAt: 2000,
				}),
			),
		).toBe(OutboundCallStatus.Ended);
	});
});
