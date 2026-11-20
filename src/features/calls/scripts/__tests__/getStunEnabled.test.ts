import { beforeEach, describe, expect, it } from 'vitest';

import { getStunEnabled } from '../getStunEnabled';

describe('getStunEnabled', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('is enabled when there is no config', () => {
		expect(getStunEnabled()).toBe(true);
	});

	it('follows the CLI stun flag of the config', () => {
		localStorage.setItem(
			'CONFIG',
			JSON.stringify({
				CLI: {
					stun: false,
				},
			}),
		);

		expect(getStunEnabled()).toBe(false);
	});

	it('is enabled when the config is not valid JSON', () => {
		localStorage.setItem('CONFIG', '{');

		expect(getStunEnabled()).toBe(true);
	});
});
