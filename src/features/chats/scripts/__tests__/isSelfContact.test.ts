import { describe, expect, it } from 'vitest';

import { isSelfContact } from '../isSelfContact';

const account = {
	contact: {
		sub: '42',
		iss: 'webitel',
	},
};

describe('isSelfContact', () => {
	it('matches the account by subject and issuer', () => {
		expect(
			isSelfContact(
				{
					sub: '42',
					iss: 'webitel',
				},
				account,
			),
		).toBe(true);
	});

	it('does not match the same subject from another issuer', () => {
		expect(
			isSelfContact(
				{
					sub: '42',
					iss: 'telegram',
				},
				account,
			),
		).toBe(false);
	});

	it('does not match another subject', () => {
		expect(
			isSelfContact(
				{
					sub: '7',
					iss: 'webitel',
				},
				account,
			),
		).toBe(false);
	});

	it('matches on the subject alone when the account names no issuer', () => {
		expect(
			isSelfContact(
				{
					sub: '42',
					iss: 'anything',
				},
				{
					contact: {
						sub: '42',
					},
				},
			),
		).toBe(true);
	});

	// "not the agent" must not be claimed for a contact that might be
	it.each([
		[
			'before the account loads',
			null,
		],
		[
			'for an account without a subject',
			{
				contact: {},
			},
		],
	])('is false %s', (_label, unknownAccount) => {
		expect(
			isSelfContact(
				{
					sub: '42',
					iss: 'webitel',
				},
				unknownAccount as never,
			),
		).toBe(false);
	});

	it('is false for no contact', () => {
		expect(isSelfContact(undefined, account)).toBe(false);
		expect(isSelfContact(null, account)).toBe(false);
	});
});
