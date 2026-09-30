import { describe, expect, it } from 'vitest';

import { toChatHeader } from '../toChatHeader';

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

describe('toChatHeader', () => {
	it('shows the messenger username and the queue', () => {
		expect(toChatHeader(task())).toEqual({
			name: 'client_username',
			queueName: 'Support',
		});
	});

	it('falls back to the contact name when there is no username', () => {
		expect(
			toChatHeader(
				task({
					displayNumber: '',
				}),
			).name,
		).toBe('Client Name');
	});

	it('leaves absent fields absent', () => {
		expect(
			toChatHeader(
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
