import { describe, expect, it } from 'vitest';

import { isDialedCall } from '../isDialedCall';

describe('isDialedCall', () => {
	it('matches the call whose sip id starts the dialled one', () => {
		expect(
			isDialedCall(
				{
					id: 'call-1',
					sipId: 'abc',
				},
				{
					sipId: 'abcfromtag',
				},
			),
		).toBe(true);
	});

	it('does not match a call with another sip id', () => {
		expect(
			isDialedCall(
				{
					id: 'call-1',
					sipId: 'xyz',
				},
				{
					sipId: 'abcfromtag',
				},
			),
		).toBe(false);
	});

	it('does not match a call that has no sip id yet', () => {
		expect(
			isDialedCall(
				{
					id: 'call-1',
					sipId: null,
				},
				{
					sipId: 'abcfromtag',
				},
			),
		).toBe(false);
	});

	it('matches the call by its call id', () => {
		expect(
			isDialedCall(
				{
					id: 'call-1',
					sipId: null,
				},
				{
					callId: 'call-1',
				},
			),
		).toBe(true);
	});

	it('matches nothing without ids', () => {
		expect(
			isDialedCall(
				{
					id: 'call-1',
					sipId: 'abc',
				},
				{},
			),
		).toBe(false);
	});
});
