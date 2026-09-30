import { describe, expect, it } from 'vitest';

import { findSelfMember } from '../findSelfMember';

const member = (id: string, sub?: string) =>
	({
		id,
		contact: {
			sub,
		},
	}) as never;

describe('findSelfMember', () => {
	const members = [
		member('client-member', 'telegram-77'),
		member('agent-member', '42'),
	];

	it('picks the member whose contact subject is the logged-in user', () => {
		expect(findSelfMember(members, 42)?.id).toBe('agent-member');
	});

	it('compares as strings, since the session id is numeric and sub is not', () => {
		expect(findSelfMember(members, '42')?.id).toBe('agent-member');
	});

	it('finds nobody rather than guessing', () => {
		expect(findSelfMember(members, 7)).toBeUndefined();
		expect(findSelfMember(members, undefined)).toBeUndefined();
		expect(findSelfMember(undefined, 42)).toBeUndefined();
		expect(
			findSelfMember(
				[
					member('no-contact'),
				],
				42,
			),
		).toBeUndefined();
	});
});
