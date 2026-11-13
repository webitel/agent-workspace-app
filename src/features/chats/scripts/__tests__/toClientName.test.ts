import { describe, expect, it } from 'vitest';

import { toClientName } from '../toClientName';

describe('toClientName', () => {
	it('names the client by their messenger username', () => {
		expect(
			toClientName({
				username: 'john',
				name: 'John Smith',
			}),
		).toBe('john');
	});

	it('falls back to the name when there is no username', () => {
		expect(
			toClientName({
				username: '',
				name: 'John Smith',
			}),
		).toBe('John Smith');
	});

	it('has no name for a contact that carries neither', () => {
		expect(toClientName({})).toBeUndefined();
	});

	it('has no name without a contact', () => {
		expect(toClientName(undefined)).toBeUndefined();
	});
});
