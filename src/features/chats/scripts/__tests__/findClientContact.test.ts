import { describe, expect, it } from 'vitest';

import { findClientContact } from '../findClientContact';

const agentContact = {
	sub: 'agent-1',
	iss: 'webitel',
	name: 'Agent',
};

const otherAgentContact = {
	sub: 'agent-2',
	iss: 'webitel',
	name: 'Other agent',
};

const clientContact = {
	sub: 'client-1',
	iss: 'telegram',
	name: 'Client',
	username: 'client',
};

const botContact = {
	sub: 'bot-1',
	iss: 'bot',
	name: 'Bot',
};

describe('findClientContact', () => {
	it('returns the member issued by neither webitel nor bot', () => {
		const members = [
			{
				contact: agentContact,
			},
			{
				contact: clientContact,
			},
		];

		expect(findClientContact(members)).toBe(clientContact);
	});

	it('skips every agent, not only the current user, as after a transfer', () => {
		const members = [
			{
				contact: otherAgentContact,
			},
			{
				contact: agentContact,
			},
			{
				contact: clientContact,
			},
		];

		expect(findClientContact(members)).toBe(clientContact);
	});

	it('skips a bot, by its issuer or by its flag', () => {
		const members: {
			contact?: {
				sub: string;
				iss?: string;
				isBot?: boolean;
			};
		}[] = [
			{
				contact: botContact,
			},
			{
				contact: {
					sub: 'bot-2',
					iss: 'custom',
					isBot: true,
				},
			},
			{
				contact: clientContact,
			},
		];

		expect(findClientContact(members)).toBe(clientContact);
	});

	it('skips a member without a contact', () => {
		const members = [
			{},
			{
				contact: clientContact,
			},
		];

		expect(findClientContact(members)).toBe(clientContact);
	});

	it('returns undefined when only agents and bots are members', () => {
		const members = [
			{
				contact: agentContact,
			},
			{
				contact: botContact,
			},
		];

		expect(findClientContact(members)).toBeUndefined();
	});

	it('returns undefined for no members or no list', () => {
		expect(findClientContact([])).toBeUndefined();
		expect(findClientContact(undefined)).toBeUndefined();
	});
});
