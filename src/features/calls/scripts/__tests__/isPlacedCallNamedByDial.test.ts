import { describe, expect, it } from 'vitest';
import type { Call } from 'webitel-sdk';

import type { OutboundCallAttempt } from '../../types/OutboundCallAttempt.types';
import { isPlacedCallNamedByDial } from '../isPlacedCallNamedByDial';

const buildAttempt = (
	overrides: Partial<OutboundCallAttempt> = {},
): OutboundCallAttempt => ({
	id: 'attempt-1',
	destination: '100',
	placedCall: null,
	callIdsBeforeDial: new Set(),
	dialedCallIds: {},
	isHangupRequested: false,
	...overrides,
});

const placedCall = {
	id: 'call-1',
	sipId: 'abc',
} as Call;

describe('isPlacedCallNamedByDial', () => {
	it('is false while the attempt has no call', () => {
		expect(
			isPlacedCallNamedByDial(
				buildAttempt({
					dialedCallIds: {
						sipId: 'abcfromtag',
					},
				}),
			),
		).toBe(false);
	});

	it('is true for the call its ids name', () => {
		expect(
			isPlacedCallNamedByDial(
				buildAttempt({
					placedCall,
					dialedCallIds: {
						sipId: 'abcfromtag',
					},
				}),
			),
		).toBe(true);
	});

	it('is false for a call linked by elimination', () => {
		expect(
			isPlacedCallNamedByDial(
				buildAttempt({
					placedCall,
				}),
			),
		).toBe(false);
	});

	it('is false for a call its ids do not name', () => {
		expect(
			isPlacedCallNamedByDial(
				buildAttempt({
					placedCall,
					dialedCallIds: {
						sipId: 'xyzfromtag',
					},
				}),
			),
		).toBe(false);
	});
});
