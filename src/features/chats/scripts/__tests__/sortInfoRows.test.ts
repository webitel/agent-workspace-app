import { describe, expect, it } from 'vitest';
import { sortInfoRows } from '../sortInfoRows';
import type { InfoRow } from '../toInfoRows';

const row = (id: string, key: string, value = ''): InfoRow => ({
	id,
	key,
	value,
});

describe('sortInfoRows', () => {
	it('keeps the incoming order, without mutating it, when there is no sort', () => {
		const rows = [
			row('task:b', 'b'),
			row('task:a', 'a'),
		];

		const sorted = sortInfoRows(rows, null);

		expect(sorted.map((item) => item.key)).toEqual([
			'b',
			'a',
		]);
		expect(sorted).not.toBe(rows);
	});

	it('sorts ascending and descending by the chosen column', () => {
		const rows = [
			row('task:b', 'b', '1'),
			row('task:c', 'c', '3'),
			row('task:a', 'a', '2'),
		];

		const keys = (sort: Parameters<typeof sortInfoRows>[1]) =>
			sortInfoRows(rows, sort).map((item) => item.key);

		expect(
			keys({
				field: 'key',
				order: 'asc',
			}),
		).toEqual([
			'a',
			'b',
			'c',
		]);
		expect(
			keys({
				field: 'key',
				order: 'desc',
			}),
		).toEqual([
			'c',
			'b',
			'a',
		]);
		expect(
			keys({
				field: 'value',
				order: 'asc',
			}),
		).toEqual([
			'b',
			'a',
			'c',
		]);
	});

	it('compares numbers inside text by magnitude and ignores case', () => {
		const rows = [
			row('task:1', 'ticket-10'),
			row('task:2', 'Ticket-2'),
			row('task:3', 'ticket-1'),
		];

		const sorted = sortInfoRows(rows, {
			field: 'key',
			order: 'asc',
		});

		expect(sorted.map((item) => item.key)).toEqual([
			'ticket-1',
			'Ticket-2',
			'ticket-10',
		]);
	});

	it('keeps the task row ahead of the thread row when their keys tie', () => {
		const rows = [
			row('task:Language', 'Language', 'EN'),
			row('thread:Language', 'Language', 'UK'),
		];

		for (const order of [
			'asc',
			'desc',
		] as const) {
			const sorted = sortInfoRows(rows, {
				field: 'key',
				order,
			});

			expect(sorted.map((item) => item.id)).toEqual([
				'task:Language',
				'thread:Language',
			]);
		}
	});
});
