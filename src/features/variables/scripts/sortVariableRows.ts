import { SortSymbols } from '@webitel/ui-sdk/scripts';

import type { VariableRow, VariableSort } from '../types/Variables.types';

const collator = new Intl.Collator(undefined, {
	numeric: true,
	sensitivity: 'base',
});

/**
 * Sorts a copy of the variable rows by one column. `numeric` makes `ticket-2` come
 * before `ticket-10`; `base` sensitivity ignores case. Ties keep their incoming
 * order in both directions (the sort is stable and descending flips the comparison,
 * not the result), so a key held by both sources stays task-first.
 */
export function sortVariableRows(
	rows: VariableRow[],
	sort: VariableSort | null,
): VariableRow[] {
	if (!sort)
		return [
			...rows,
		];

	const direction = sort.order === SortSymbols.ASC ? 1 : -1;
	return [
		...rows,
	].sort(
		(first, second) =>
			direction * collator.compare(first[sort.field], second[sort.field]),
	);
}
