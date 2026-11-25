import { describe, expect, it } from 'vitest';

import { hasDialedCallIds } from '../hasDialedCallIds';

describe('hasDialedCallIds', () => {
	it('is false without ids', () => {
		expect(hasDialedCallIds({})).toBe(false);
	});

	it('is true with either id', () => {
		expect(
			hasDialedCallIds({
				sipId: 'abc',
			}),
		).toBe(true);
		expect(
			hasDialedCallIds({
				callId: 'call-1',
			}),
		).toBe(true);
	});
});
