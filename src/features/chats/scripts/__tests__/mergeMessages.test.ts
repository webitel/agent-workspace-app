import { describe, expect, it } from 'vitest';

import { mergeMessages } from '../mergeMessages';

const message = (id: string, createdAt?: number, body?: string) =>
	({
		id,
		createdAt: createdAt === undefined ? undefined : String(createdAt),
		body,
	}) as never;

const ids = (
	messages: {
		id: string;
	}[],
) => messages.map((merged) => merged.id);

describe('mergeMessages', () => {
	it('takes a message both lists hold from the incoming one', () => {
		const merged = mergeMessages(
			[
				message('m1', 1000, 'original'),
			],
			[
				message('m1', 1000, 'edited'),
			],
		);

		expect(merged).toEqual([
			message('m1', 1000, 'edited'),
		]);
	});

	it('adds the messages only the incoming list holds', () => {
		const merged = mergeMessages(
			[
				message('m1', 1000),
			],
			[
				message('m2', 2000),
			],
		);

		expect(ids(merged)).toEqual([
			'm1',
			'm2',
		]);
	});

	// a message read from history after a newer one arrived live
	it('orders the result by when each message was sent', () => {
		const merged = mergeMessages(
			[
				message('m1', 1000),
				message('m3', 3000),
			],
			[
				message('m2', 2000),
			],
		);

		expect(ids(merged)).toEqual([
			'm1',
			'm2',
			'm3',
		]);
	});

	it('keeps the given order for messages without a time', () => {
		const merged = mergeMessages(
			[
				message('b'),
				message('a'),
			],
			[
				message('c'),
			],
		);

		expect(ids(merged)).toEqual([
			'b',
			'a',
			'c',
		]);
	});
});
