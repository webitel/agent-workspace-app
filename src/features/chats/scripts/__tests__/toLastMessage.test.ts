import { describe, expect, it } from 'vitest';

import { toLastMessage } from '../toLastMessage';

const buildMessage = (overrides: Record<string, unknown> = {}) =>
	({
		id: 'm1',
		body: 'hello',
		createdAt: '1760000000000',
		sender: {
			id: 'member-client',
		},
		...overrides,
	}) as never;

describe('toLastMessage', () => {
	it('keeps the text, the time and who sent it', () => {
		expect(toLastMessage(buildMessage())).toEqual({
			id: 'm1',
			body: 'hello',
			at: 1760000000000,
			senderId: 'member-client',
		});
	});

	// a system notice is nobody's message: it must not replace the real last one
	it('skips system notices', () => {
		expect(
			toLastMessage(
				buildMessage({
					system: {
						memberJoined: {},
					},
				}),
			),
		).toBeUndefined();
	});

	it('keeps a deleted message in place, without a body', () => {
		const lastMessage = toLastMessage(
			buildMessage({
				body: '',
				deleted: true,
			}),
		);

		expect(lastMessage?.id).toBe('m1');
		expect(lastMessage?.body).toBeUndefined();
	});

	it.each([
		[
			undefined,
		],
		[
			'',
		],
		[
			'not-a-number',
		],
		[
			'0',
		],
	])('drops an unusable timestamp: %s', (createdAt) => {
		expect(
			toLastMessage(
				buildMessage({
					createdAt,
				}),
			)?.at,
		).toBeUndefined();
	});

	it('tolerates a message with no sender', () => {
		expect(
			toLastMessage(
				buildMessage({
					sender: undefined,
				}),
			)?.senderId,
		).toBeUndefined();
	});
});
