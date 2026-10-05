import { describe, expect, it } from 'vitest';

import { toChatPreview } from '../toChatPreview';

const account = {
	contact: {
		sub: '42',
		iss: 'webitel',
	},
};

const buildTask = (overrides: Record<string, unknown> = {}) =>
	({
		displayName: 'John Smith',
		displayNumber: '@john',
		queue: {
			id: 1,
			name: 'Support',
		},
		thread: {
			id: 't1',
			lastMsg: 'task text',
			members: [
				{
					id: 'member-client',
					contact: {
						sub: 'client-1',
						iss: 'telegram',
					},
				},
				{
					id: 'member-agent',
					contact: {
						sub: '42',
						iss: 'webitel',
					},
				},
			],
		},
		...overrides,
	}) as never;

const buildLastMessage = (overrides: Record<string, unknown> = {}) => ({
	id: 'm1',
	body: 'message text',
	at: 1760000000000,
	senderId: 'member-client',
	...overrides,
});

describe('toChatPreview', () => {
	// AC_03.01.01: the list reads the same as the top bar after opening
	it('names the chat the way its header does', () => {
		const preview = toChatPreview(buildTask(), buildLastMessage(), account);

		expect(preview.name).toBe('@john');
		expect(preview.queueName).toBe('Support');
	});

	it('falls back to the contact name when the client has no username', () => {
		const preview = toChatPreview(
			buildTask({
				displayNumber: '',
			}),
			buildLastMessage(),
			account,
		);

		expect(preview.name).toBe('John Smith');
	});

	it('takes text, time and sender from the last message', () => {
		expect(
			toChatPreview(buildTask(), buildLastMessage(), account).lastMessage,
		).toEqual({
			body: 'message text',
			at: 1760000000000,
			sender: 'client',
		});
	});

	it("marks the agent's own message as theirs", () => {
		expect(
			toChatPreview(
				buildTask(),
				buildLastMessage({
					senderId: 'member-agent',
				}),
				account,
			).lastMessage?.sender,
		).toBe('agent');
	});

	// a bot or another operator is not the agent
	it('treats any other member as not the agent', () => {
		expect(
			toChatPreview(
				buildTask(),
				buildLastMessage({
					senderId: 'member-bot',
				}),
				account,
			).lastMessage?.sender,
		).toBe('client');
	});

	// without the account the agent's member cannot be found; saying "client"
	// would be wrong for half the messages
	it('does not guess the sender before the account loads', () => {
		expect(
			toChatPreview(buildTask(), buildLastMessage(), null).lastMessage?.sender,
		).toBeUndefined();
	});

	it('does not guess the sender when the message names none', () => {
		expect(
			toChatPreview(
				buildTask(),
				buildLastMessage({
					senderId: undefined,
				}),
				account,
			).lastMessage?.sender,
		).toBeUndefined();
	});

	describe('before the last message is known', () => {
		it('shows the task text, without time or sender', () => {
			expect(
				toChatPreview(buildTask(), undefined, account).lastMessage,
			).toEqual({
				body: 'task text',
				at: undefined,
				sender: undefined,
			});
		});

		it('has no last message at all when the task carries no text either', () => {
			const preview = toChatPreview(
				buildTask({
					thread: {
						id: 't1',
					},
				}),
				undefined,
				account,
			);

			expect(preview.lastMessage).toBeUndefined();
		});
	});

	// an attachment has no text of its own; the row should not go blank
	it('falls back to the task text for a message with no body', () => {
		const preview = toChatPreview(
			buildTask(),
			buildLastMessage({
				body: undefined,
			}),
			account,
		);

		expect(preview.lastMessage?.body).toBe('task text');
		expect(preview.lastMessage?.at).toBe(1760000000000);
	});

	it('tolerates a task with no thread', () => {
		expect(
			toChatPreview(
				buildTask({
					thread: undefined,
				}),
				undefined,
				account,
			).lastMessage,
		).toBeUndefined();
	});
});
