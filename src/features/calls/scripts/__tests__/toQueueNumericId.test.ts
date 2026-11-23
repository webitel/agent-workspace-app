import { describe, expect, it } from 'vitest';

import { toQueueNumericId } from '../toQueueNumericId';

describe('toQueueNumericId', () => {
	it('turns a numeric id into a number', () => {
		expect(toQueueNumericId('7')).toBe(7);
	});

	it('is null for an empty id, which Number() would turn into 0', () => {
		expect(toQueueNumericId('')).toBeNull();
	});

	it('is null for zero and for a negative id', () => {
		expect(toQueueNumericId('0')).toBeNull();
		expect(toQueueNumericId('-3')).toBeNull();
	});

	it('is null for an id that is not a number', () => {
		expect(toQueueNumericId('abc')).toBeNull();
	});

	it('is null for a fractional id', () => {
		expect(toQueueNumericId('7.5')).toBeNull();
	});
});
