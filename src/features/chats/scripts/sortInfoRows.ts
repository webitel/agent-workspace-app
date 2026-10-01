import type { InfoRow } from './toInfoRows';

export interface InfoSort {
	field: 'key' | 'value';
	order: 'asc' | 'desc';
}

const collator = new Intl.Collator(undefined, {
	numeric: true,
	sensitivity: 'base',
});

/**
 * Sorts a copy of the Info rows by one column. `numeric` makes `ticket-2` come
 * before `ticket-10`; `base` sensitivity ignores case. Ties keep their incoming
 * order in both directions (the sort is stable and `desc` flips the comparison,
 * not the result), so a key held by both sources stays task-first.
 */
export function sortInfoRows(
	rows: InfoRow[],
	sort: InfoSort | null,
): InfoRow[] {
	if (!sort)
		return [
			...rows,
		];

	const direction = sort.order === 'asc' ? 1 : -1;
	return [
		...rows,
	].sort(
		(first, second) =>
			direction * collator.compare(first[sort.field], second[sort.field]),
	);
}
