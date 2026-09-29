import { describe, expect, it } from 'vitest';

import { toDialableDestination } from '../toDialableDestination';

describe('toDialableDestination', () => {
	it('strips formatting from a pasted phone number', () => {
		expect(toDialableDestination('+38 (067) 123-45-67')).toBe('+380671234567');
	});

	it('keeps service code characters', () => {
		expect(toDialableDestination('*100#')).toBe('*100#');
	});

	it('keeps letters so SIP users and extensions stay dialable', () => {
		expect(toDialableDestination('agent01')).toBe('agent01');
	});

	it('returns an empty string when nothing dialable is left', () => {
		expect(toDialableDestination(' - () ')).toBe('');
	});
});
