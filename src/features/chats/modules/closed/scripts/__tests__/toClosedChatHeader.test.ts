import { describe, expect, it } from 'vitest';

import type { ILeftThread } from '../../../../types/ChatSession.types';
import { toClosedChatHeader } from '../toClosedChatHeader';

const threadWith = (
	contacts: {
		name?: string;
		username?: string;
		sub?: string;
		iss?: string;
		isBot?: boolean;
	}[],
) =>
	({
		id: 'thread-1',
		members: contacts.map((contact, index) => ({
			id: `member-${index}`,
			contact,
		})),
	}) as unknown as ILeftThread;

describe('toClosedChatHeader', () => {
	it("names the chat after the client's username", () => {
		const thread = threadWith([
			{
				sub: 'agent-sub',
				iss: 'webitel',
				username: 'agent',
			},
			{
				sub: 'client-sub',
				iss: 'telegram',
				username: 'client_username',
				name: 'Client Name',
			},
		]);

		expect(toClosedChatHeader(thread).name).toBe('client_username');
	});

	it('falls back to the client name when there is no username', () => {
		const thread = threadWith([
			{
				sub: 'client-sub',
				iss: 'telegram',
				name: 'Client Name',
			},
		]);

		expect(toClosedChatHeader(thread).name).toBe('Client Name');
	});

	it('has no name when the thread has no client', () => {
		const thread = threadWith([
			{
				sub: 'agent-sub',
				iss: 'webitel',
				username: 'agent',
			},
			{
				sub: 'bot-sub',
				iss: 'bot',
				username: 'bot',
				isBot: true,
			},
		]);

		expect(toClosedChatHeader(thread).name).toBeUndefined();
	});

	it('never has a queue: a left thread does not carry one', () => {
		const thread = threadWith([
			{
				sub: 'client-sub',
				iss: 'telegram',
				username: 'client_username',
			},
		]);

		expect(toClosedChatHeader(thread).queueName).toBeUndefined();
	});
});
