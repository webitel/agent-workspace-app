import { describe, expect, it } from 'vitest';

import { toVariableRows } from '../toVariableRows';

describe('toVariableRows', () => {
	it("makes a row per variable, in the map's order, with ids qualified by source", () => {
		expect(
			toVariableRows(
				{
					CustomerID: '458732',
					Region: 'EU',
				},
				'call',
			),
		).toEqual([
			{
				id: 'call:CustomerID',
				key: 'CustomerID',
				value: '458732',
			},
			{
				id: 'call:Region',
				key: 'Region',
				value: 'EU',
			},
		]);
	});

	it('formats values for a cell', () => {
		const [row] = toVariableRows(
			{
				Plan: {
					tier: 'gold',
				},
			},
			'call',
		);

		expect(row.value).toBe('{"tier":"gold"}');
	});

	it('yields no rows when there are no variables', () => {
		expect(toVariableRows(undefined, 'call')).toEqual([]);
		expect(toVariableRows({}, 'call')).toEqual([]);
	});
});
