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
			findSelfMemberId({
				thread,
				account: {
					contact: {
						sub: '42',
						iss: 'webitel',
					},
				},
			}),
		).toBe('m-agent');
	});

	it('does not match the same subject from another issuer', () => {
		expect(
			findSelfMemberId({
				thread,
				account: {
					contact: {
						sub: '42',
						iss: 'other',
					},
				},
			}),
		).toBe('');
	});

	it('is empty without an account, a thread or membership', () => {
		expect(
			findSelfMemberId({
				thread,
				account: null,
			}),
		).toBe('');
		expect(
			findSelfMemberId({
				thread: null,
				account: {
					contact: {
						sub: '42',
					},
				},
			}),
		).toBe('');
		expect(
			findSelfMemberId({
				thread,
				account: {
					contact: {
						sub: 'nobody',
					},
				},
			}),
		).toBe('');
	});

	describe('without a loaded account', () => {
		it('finds the member by the webitel user id', () => {
			expect(
				findSelfMemberId({
					thread,
					account: null,
					webitelUserId: '42',
				}),
			).toBe('m-agent');
			expect(
				findSelfMemberId({
					thread,
					account: null,
					webitelUserId: 42,
				}),
			).toBe('m-agent');
		});

		it('does not take a messenger contact with the same subject for the operator', () => {
			expect(
				findSelfMemberId({
					thread,
					account: null,
					webitelUserId: 'client-1',
				}),
			).toBe('');
		});

		it.each([
			undefined,
			null,
			'',
		])('is empty for the user id %j', (webitelUserId) => {
			expect(
				findSelfMemberId({
					thread,
					account: null,
					webitelUserId,
				}),
			).toBe('');
		});
	});

	it('trusts the loaded account over the user id', () => {
		expect(
			findSelfMemberId({
				thread,
				account: {
					contact: {
						sub: 'client-1',
						iss: 'telegram',
					},
				},
				webitelUserId: '42',
			}),
		).toBe('m-client');
	});
});
