import type { SortSymbols } from '@webitel/ui-sdk/scripts';

/** One line of a Key/Value variables table, whichever interaction it came from. */
export interface VariableRow {
	/**
	 * unique within a table: callers that merge several sources qualify it
	 * (`task:Language`), because the same key may legitimately come from each
	 */
	id: string;
	key: string;
	value: string;
}

export interface VariableSort {
	field: 'key' | 'value';
	order: typeof SortSymbols.ASC | typeof SortSymbols.DESC;
}
