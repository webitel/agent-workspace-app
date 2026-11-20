import { describe, expect, it } from 'vitest';

import { toPositiveNumericId } from '../toPositiveNumericId';

describe('toPositiveNumericId', () => {
	it('turns a numeric id into a number', () => {
		expect(toPositiveNumericId('7')).toBe(7);
	});

	it('is null for an empty id, which Number() would turn into 0', () => {
		expect(toPositiveNumericId('')).toBeNull();
	});

	it('is null for zero and for a negative id', () => {
		expect(toPositiveNumericId('0')).toBeNull();
		expect(toPositiveNumericId('-3')).toBeNull();
	});

	it('is null for an id that is not a number', () => {
		expect(toPositiveNumericId('abc')).toBeNull();
	});

	it('is null for a fractional id', () => {
		expect(toPositiveNumericId('7.5')).toBeNull();
	});
});
