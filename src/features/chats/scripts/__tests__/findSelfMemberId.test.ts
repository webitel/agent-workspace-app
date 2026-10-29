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

	describe('without a loaded account', () => {
		it('finds the member by the webitel user id', () => {
			expect(findSelfMemberId(thread, null, '42')).toBe('m-agent');
			expect(findSelfMemberId(thread, null, 42)).toBe('m-agent');
		});

		it('does not take a messenger contact with the same subject for the operator', () => {
			expect(findSelfMemberId(thread, null, 'client-1')).toBe('');
		});

		it('is empty without a user id', () => {
			expect(findSelfMemberId(thread, null)).toBe('');
			expect(findSelfMemberId(thread, null, null)).toBe('');
			expect(findSelfMemberId(thread, null, '')).toBe('');
		});
	});

	it('trusts the loaded account over the user id', () => {
		expect(
			findSelfMemberId(
				thread,
				{
					contact: {
						sub: 'client-1',
						iss: 'telegram',
					},
				},
				'42',
			),
		).toBe('m-client');
	});
});
