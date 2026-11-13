import { describe, expect, it } from 'vitest';

import { toChatTitle } from '../toChatTitle';

const task = (overrides = {}) =>
	({
		displayNumber: 'client_username',
		displayName: 'Client Name',
		queue: {
			id: 1,
			name: 'Support',
		},
		...overrides,
	}) as never;

describe('toChatTitle', () => {
	it('shows the messenger username and the queue', () => {
		expect(toChatTitle(task())).toEqual({
			name: 'client_username',
			queueName: 'Support',
		});
	});

	it('falls back to the contact name when there is no username', () => {
		expect(
			toChatTitle(
				task({
					displayNumber: '',
				}),
			).name,
		).toBe('Client Name');
	});

	// the task's name is a snapshot from distribution; the thread's members are
	// what the chat list has just read
	it('names the chat by the client of the thread over the task', () => {
		expect(
			toChatTitle(task(), {
				username: 'johnny',
				name: 'John S.',
			}).name,
		).toBe('johnny');
	});

	it('keeps the name of the task for a client that carries no name', () => {
		expect(toChatTitle(task(), {}).name).toBe('client_username');
	});

	it('leaves absent fields absent', () => {
		expect(
			toChatTitle(
				task({
					displayNumber: '',
					displayName: null,
					queue: undefined,
				}),
			),
		).toEqual({
			name: undefined,
			queueName: undefined,
		});
	});
});
