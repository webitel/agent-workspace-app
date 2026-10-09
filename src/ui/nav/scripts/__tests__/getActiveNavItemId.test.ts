import { describe, expect, it } from 'vitest';

import { getActiveNavItemId } from '../getActiveNavItemId';

const routeItemIds = [
	'/',
	'/calls',
	'/chats',
];

describe('getActiveNavItemId', () => {
	it('activates home only on the exact root path', () => {
		expect(getActiveNavItemId('/', routeItemIds)).toBe('/');
	});

	it('activates the item whose path equals the current path', () => {
		expect(getActiveNavItemId('/calls', routeItemIds)).toBe('/calls');
	});

	it('keeps the item active on its nested routes', () => {
		expect(getActiveNavItemId('/chats/thread-1', routeItemIds)).toBe('/chats');
	});

	it('does not match a path that only shares a prefix', () => {
		expect(getActiveNavItemId('/callsign', routeItemIds)).toBe('');
	});

	it('activates nothing on an unknown path', () => {
		expect(getActiveNavItemId('/settings', routeItemIds)).toBe('');
	});
});
