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
		const cellFor = (value: unknown) =>
			toInfoRows({
				taskVariables: {
					key: value,
				},
			})[0].value;

		it('stringifies numbers and booleans', () => {
			expect(cellFor(42)).toBe('42');
			expect(cellFor(false)).toBe('false');
		});

		it('renders null and undefined as an empty cell', () => {
			expect(cellFor(null)).toBe('');
			expect(cellFor(undefined)).toBe('');
		});

		it('renders objects and arrays as compact JSON', () => {
			expect(
				cellFor({
					tier: 'gold',
				}),
			).toBe('{"tier":"gold"}');
			expect(
				cellFor([
					1,
					2,
				]),
			).toBe('[1,2]');
		});

		it('unwraps the {"value": …} envelope the thread puts around its values', () => {
			const [row] = toInfoRows({
				threadVariables: {
					Note: {
						value: {
							value: 'plain text',
						},
					},
				},
			});

			expect(row.value).toBe('plain text');
		});

		it('keeps a structured thread value that is more than the envelope', () => {
			const [row] = toInfoRows({
				threadVariables: {
					Plan: {
						value: {
							value: 'gold',
							since: 2024,
						},
					},
				},
			});

			expect(row.value).toBe('{"value":"gold","since":2024}');
		});

		it('does not unwrap task variables, which carry no envelope', () => {
			const [row] = toInfoRows({
				taskVariables: {
					Plan: {
						value: 'gold',
					},
				},
			});

			expect(row.value).toBe('{"value":"gold"}');
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
