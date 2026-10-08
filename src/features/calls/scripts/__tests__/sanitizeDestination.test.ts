import { describe, expect, it } from 'vitest';

import { sanitizeDestination } from '../sanitizeDestination';

describe('sanitizeDestination', () => {
	it('strips formatting from a pasted phone number', () => {
		expect(sanitizeDestination('+38 (067) 123-45-67')).toBe('+380671234567');
	});

	it('keeps service code characters', () => {
		expect(sanitizeDestination('*100#')).toBe('*100#');
	});

	it('keeps letters so SIP users and extensions stay dialable', () => {
		expect(sanitizeDestination('agent01')).toBe('agent01');
	});

	it('returns an empty string when nothing dialable is left', () => {
		expect(sanitizeDestination(' - () ')).toBe('');
	});
});
