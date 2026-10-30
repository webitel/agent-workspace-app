import { describe, expect, it } from 'vitest';

import { matchesChatSearch } from '../matchesChatSearch';

const buildTask = (overrides: Record<string, unknown> = {}) =>
	({
		displayName: 'Jane Doe',
		displayNumber: '@jane_d',
		...overrides,
	}) as never;

describe('matchesChatSearch', () => {
	it('matches a part of the client’s name, whatever its case', () => {
		expect(matchesChatSearch(buildTask(), 'jane')).toBe(true);
		expect(matchesChatSearch(buildTask(), 'DOE')).toBe(true);
	});

	// the row shows the username and falls back to the name: either can be typed
	it('matches a part of the username too', () => {
		expect(matchesChatSearch(buildTask(), '@jane_')).toBe(true);
		expect(matchesChatSearch(buildTask(), 'jane_d')).toBe(true);
	});

	it('does not match what is in neither', () => {
		expect(matchesChatSearch(buildTask(), 'john')).toBe(false);
	});

	it('matches everything while nothing is searched for', () => {
		expect(matchesChatSearch(buildTask(), '')).toBe(true);
		expect(matchesChatSearch(buildTask(), '   ')).toBe(true);
	});

	it('ignores spaces around what was typed', () => {
		expect(matchesChatSearch(buildTask(), '  doe ')).toBe(true);
	});

	it('copes with a chat that has no name at all', () => {
		expect(
			matchesChatSearch(
				buildTask({
					displayName: undefined,
					displayNumber: undefined,
				}),
				'jane',
			),
		).toBe(false);
		expect(
			matchesChatSearch(
				buildTask({
					displayName: undefined,
					displayNumber: undefined,
				}),
				'',
			),
		).toBe(true);
	});

	it('matches by the username when the contact has no name', () => {
		expect(
			matchesChatSearch(
				buildTask({
					displayName: '',
				}),
				'jane_d',
			),
		).toBe(true);
	});
});
