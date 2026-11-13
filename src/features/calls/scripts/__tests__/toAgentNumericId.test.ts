import { describe, expect, it } from 'vitest';

import { toAgentNumericId } from '../toAgentNumericId';

describe('toAgentNumericId', () => {
	it('turns a numeric id into a number', () => {
		expect(toAgentNumericId('42')).toBe(42);
	});

	it('is null for an id that is not a number', () => {
		expect(toAgentNumericId('abc')).toBeNull();
	});

	it('is null for a fractional id', () => {
		expect(toAgentNumericId('4.2')).toBeNull();
	});
});
