import { describe, expect, it } from 'vitest';

import { toDialedCallIds } from '../toDialedCallIds';

describe('toDialedCallIds', () => {
	it('has no ids when the SDK returns nothing', () => {
		expect(toDialedCallIds(undefined)).toEqual({});
	});

	it('keeps the sip id the web phone dial returns', () => {
		expect(
			toDialedCallIds({
				sipId: 'abc123',
			}),
		).toEqual({
			sipId: 'abc123',
		});
	});

	it('keeps the call id the dial without a web phone returns', () => {
		expect(
			toDialedCallIds({
				callId: 'call-1',
			}),
		).toEqual({
			callId: 'call-1',
		});
	});

	it('drops ids that are empty or not strings', () => {
		expect(
			toDialedCallIds({
				callId: '',
				sipId: 42,
			}),
		).toEqual({});
	});

	it('has no ids for a value that is not an object', () => {
		expect(toDialedCallIds('call-1')).toEqual({});
		expect(toDialedCallIds(null)).toEqual({});
	});
});
