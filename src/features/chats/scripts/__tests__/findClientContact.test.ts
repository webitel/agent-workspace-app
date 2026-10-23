import { describe, expect, it } from 'vitest';

import { findClientContact } from '../findClientContact';

const agentContact = {
	sub: 'agent-1',
	name: 'Agent',
};

const clientContact = {
	sub: 'client-1',
	name: 'Client',
	username: 'client',
};

const botContact = {
	sub: 'bot-1',
	name: 'Bot',
	isBot: true,
};

describe('findClientContact', () => {
	it('returns the non-bot member whose subject is not the current user', () => {
		const members = [
			{
				contact: agentContact,
			},
			{
				contact: clientContact,
			},
		];

		expect(findClientContact(members, 'agent-1')).toBe(clientContact);
	});

	it('skips a bot member', () => {
		const members = [
			{
				contact: agentContact,
			},
			{
				contact: botContact,
			},
			{
				contact: clientContact,
			},
		];

		expect(findClientContact(members, 'agent-1')).toBe(clientContact);
	});

	it('skips the current user', () => {
		const members = [
			{
				contact: agentContact,
			},
		];

		expect(findClientContact(members, 'agent-1')).toBeUndefined();
	});

	it('returns undefined for no members or no list', () => {
		expect(findClientContact([], 'agent-1')).toBeUndefined();
		expect(findClientContact(undefined, 'agent-1')).toBeUndefined();
	});
});
