import { describe, expect, it } from 'vitest';
import { CallDirection } from 'webitel-sdk';
import { getCallPhoneNumber } from '../getCallPhoneNumber';

describe('getCallPhoneNumber', () => {
	it('returns the callee number for an outbound call', () => {
		expect(
			getCallPhoneNumber({
				direction: CallDirection.Outbound,
				to: {
					number: '380501112233',
				},
				from: {
					number: '100',
				},
			}),
		).toBe('380501112233');
	});

	it('falls back to the dialed destination for an outbound call', () => {
		expect(
			getCallPhoneNumber({
				direction: CallDirection.Outbound,
				destination: '0501112233',
			}),
		).toBe('0501112233');
	});

	it('returns the caller number for an inbound call', () => {
		expect(
			getCallPhoneNumber({
				direction: CallDirection.Inbound,
				from: {
					number: '380501112233',
				},
				to: {
					number: '100',
				},
			}),
		).toBe('380501112233');
	});
});
