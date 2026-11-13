import { describe, expect, it } from 'vitest';

import { toChatPreview } from '../toChatPreview';

const account = {
	contact: {
		sub: '42',
		iss: 'webitel',
	},
};

// the snapshot a task carries from distribution: text and members that may
// already be out of date, and which the preview must not read
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
			lastMsg: 'text from distribution',
			members: [
				{
					id: 'member-client',
					contact: {
						sub: 'client-1',
						iss: 'telegram',
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
	senderContact: {
		sub: 'client-1',
		iss: 'telegram',
	},
	...overrides,
});

describe('toChatPreview', () => {
	// AC_03.01.01: the list reads the same as the top bar after opening
	it('names the chat the way its title does', () => {
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

	// the task's name is a snapshot from distribution; the thread's members are
	// what the chat list page has just read
	describe('client from the thread', () => {
		it('names the chat by the client among the thread members', () => {
			const preview = toChatPreview(buildTask(), buildLastMessage(), account, {
				client: {
					username: 'johnny',
					name: 'John S.',
				},
			});

			expect(preview.name).toBe('johnny');
		});

		it('keeps the title name for a client that carries no name', () => {
			const preview = toChatPreview(buildTask(), buildLastMessage(), account, {
				client: {},
			});

			expect(preview.name).toBe('@john');
		});
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

	describe('who wrote the last message', () => {
		it("marks the agent's own message as theirs", () => {
			expect(
				toChatPreview(
					buildTask(),
					buildLastMessage({
						senderContact: {
							sub: '42',
							iss: 'webitel',
						},
					}),
					account,
				).lastMessage?.sender,
			).toBe('agent');
		});

		// a bot or another operator is not the agent
		it('treats any other contact as not the agent', () => {
			expect(
				toChatPreview(
					buildTask(),
					buildLastMessage({
						senderContact: {
							sub: '7',
							iss: 'webitel',
						},
					}),
					account,
				).lastMessage?.sender,
			).toBe('client');
		});

		// the snapshot's member list is not consulted: at distribution the agent
		// is not a member yet, and the message names its sender anyway
		it('does not need the agent to be among the task thread members', () => {
			expect(
				toChatPreview(
					buildTask(),
					buildLastMessage({
						senderContact: {
							sub: '42',
							iss: 'webitel',
						},
					}),
					account,
				).lastMessage?.sender,
			).toBe('agent');
		});

		// without the account the agent cannot be recognised; saying "client"
		// would be wrong for half the messages
		it('does not guess before the account loads', () => {
			expect(
				toChatPreview(buildTask(), buildLastMessage(), null).lastMessage
					?.sender,
			).toBeUndefined();
		});

		it('does not guess when the message names no sender', () => {
			expect(
				toChatPreview(
					buildTask(),
					buildLastMessage({
						senderContact: undefined,
					}),
					account,
				).lastMessage?.sender,
			).toBeUndefined();
		});
	});

	// the task's text is a snapshot from distribution and nothing refreshes it,
	// so it is not shown, not even until the first read answers
	describe('before the last message is known', () => {
		it('shows no message, though the task carries text', () => {
			expect(
				toChatPreview(buildTask(), undefined, account).lastMessage,
			).toBeUndefined();
		});

		it('still names the chat', () => {
			const preview = toChatPreview(buildTask(), undefined, account);

			expect(preview.name).toBe('@john');
			expect(preview.queueName).toBe('Support');
		});
	});

	it('does not put the task text on a newer message that has no body', () => {
		const preview = toChatPreview(
			buildTask(),
			buildLastMessage({
				body: undefined,
			}),
			account,
		);

		expect(preview.lastMessage?.body).toBeUndefined();
		expect(preview.lastMessage?.at).toBe(1760000000000);
		expect(preview.lastMessage?.sender).toBe('client');
	});

	// AC_02.03.02: the gateway is the thread's, the task carries none
	describe('channel', () => {
		it('names the gateway and gives it its logo', () => {
			expect(
				toChatPreview(buildTask(), buildLastMessage(), account, {
					channel: {
						name: 'Support bot',
						type: 'THREAD_CHANNEL_TYPE_TELEGRAM_BOT',
					},
				}).channel,
			).toEqual({
				name: 'Support bot',
				icon: 'telegram-bot',
			});
		});

		it('keeps the name of a gateway with no logo', () => {
			expect(
				toChatPreview(buildTask(), buildLastMessage(), account, {
					channel: {
						name: 'Gate',
						type: 'THREAD_CHANNEL_TYPE_UNSPECIFIED',
					},
				}).channel,
			).toEqual({
				name: 'Gate',
				icon: undefined,
			});
		});

		it('leaves out a gateway without a name', () => {
			expect(
				toChatPreview(buildTask(), buildLastMessage(), account, {
					channel: {
						type: 'THREAD_CHANNEL_TYPE_WHATSAPP',
					},
				}).channel,
			).toBeUndefined();
		});

		it('has no channel until the thread is known', () => {
			expect(
				toChatPreview(buildTask(), buildLastMessage(), account).channel,
			).toBeUndefined();
		});
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
