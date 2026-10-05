import { describe, expect, it } from 'vitest';

import { findSelfMemberId } from '../findSelfMemberId';

const thread = {
	id: 't1',
	members: [
		{
			id: 'm-client',
			contact: {
				sub: 'client-1',
				iss: 'telegram',
			},
		},
		{
			id: 'm-agent',
			contact: {
				sub: '42',
				iss: 'webitel',
			},
		},
	],
} as never;

describe('findSelfMemberId', () => {
	it('matches the account by subject and issuer', () => {
		expect(
			findSelfMemberId(thread, {
				contact: {
					sub: '42',
					iss: 'webitel',
				},
			}),
		).toBe('m-agent');
	});

	it('does not match the same subject from another issuer', () => {
		expect(
			findSelfMemberId(thread, {
				contact: {
					sub: '42',
					iss: 'other',
				},
			}),
		).toBe('');
	});

	it('is empty without an account, a thread or membership', () => {
		expect(findSelfMemberId(thread, null)).toBe('');
		expect(
			findSelfMemberId(null, {
				contact: {
					sub: '42',
				},
			}),
		).toBe('');
		expect(
			findSelfMemberId(thread, {
				contact: {
					sub: 'nobody',
				},
			}),
		).toBe('');
	});
});
