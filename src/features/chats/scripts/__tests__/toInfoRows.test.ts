import { describe, expect, it } from 'vitest';

import { toInfoRows } from '../toInfoRows';

describe('toInfoRows', () => {
	it('lists task variables first, then thread variables', () => {
		const rows = toInfoRows({
			taskVariables: {
				CustomerID: '458732',
			},
			threadVariables: {
				Region: {
					value: 'EU',
				},
			},
		});

		expect(rows).toEqual([
			{
				id: 'task:CustomerID',
				key: 'CustomerID',
				value: '458732',
			},
			{
				id: 'thread:Region',
				key: 'Region',
				value: 'EU',
			},
		]);
	});

	it('keeps both rows when the same key comes from both sources', () => {
		const rows = toInfoRows({
			taskVariables: {
				Language: 'EN',
			},
			threadVariables: {
				Language: {
					value: 'UK',
				},
			},
		});

		expect(rows).toEqual([
			expect.objectContaining({
				id: 'task:Language',
				value: 'EN',
			}),
			expect.objectContaining({
				id: 'thread:Language',
				value: 'UK',
			}),
		]);
	});

	it('yields no rows when neither source has variables', () => {
		expect(toInfoRows({})).toEqual([]);
	});

	describe('value formatting', () => {
		const valueOf = (value: unknown) =>
			toInfoRows({
				taskVariables: {
					key: value,
				},
			})[0].value;

		it('stringifies numbers and booleans', () => {
			expect(valueOf(42)).toBe('42');
			expect(valueOf(false)).toBe('false');
		});

		it('renders null and undefined as an empty cell', () => {
			expect(valueOf(null)).toBe('');
			expect(valueOf(undefined)).toBe('');
		});

		it('renders objects and arrays as compact JSON', () => {
			expect(
				valueOf({
					tier: 'gold',
				}),
			).toBe('{"tier":"gold"}');
			expect(
				valueOf([
					1,
					2,
				]),
			).toBe('[1,2]');
		});

		it('formats a thread variable entry without a value as an empty cell', () => {
			const [row] = toInfoRows({
				threadVariables: {
					Unset: {},
				},
			});

			expect(row.value).toBe('');
		});
	});
});
