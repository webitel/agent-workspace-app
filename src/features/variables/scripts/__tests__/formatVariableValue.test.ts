import { describe, expect, it } from 'vitest';

import { formatVariableValue } from '../formatVariableValue';

describe('formatVariableValue', () => {
	it('passes strings through whole', () => {
		const long = 'x'.repeat(300);

		expect(formatVariableValue('plain text')).toBe('plain text');
		expect(formatVariableValue(long)).toBe(long);
	});

	it('stringifies numbers and booleans', () => {
		expect(formatVariableValue(42)).toBe('42');
		expect(formatVariableValue(false)).toBe('false');
	});

	it('renders null and undefined as an empty cell', () => {
		expect(formatVariableValue(null)).toBe('');
		expect(formatVariableValue(undefined)).toBe('');
	});

	it('renders objects and arrays as compact JSON', () => {
		expect(
			formatVariableValue({
				tier: 'gold',
			}),
		).toBe('{"tier":"gold"}');
		expect(
			formatVariableValue([
				1,
				2,
			]),
		).toBe('[1,2]');
	});
});
