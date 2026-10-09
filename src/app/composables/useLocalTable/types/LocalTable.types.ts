import type { WtTableHeader } from '@webitel/ui-sdk/components/wt-table/types/WtTable';
import type { MaybeRefOrGetter } from 'vue';

/** What a column sorts by. An empty value sorts last in either direction. */
export type LocalTableSortValue = string | number | undefined;

export interface UseLocalTableOptions<Row> {
	/** Every row; the table searches, sorts and pages them on the client. */
	rows: MaybeRefOrGetter<Row[]>;
	/**
	 * Columns in their initial order. Whether one sorts comes from `sortValues`;
	 * a sortable one given a `sort` starts sorted that way.
	 */
	headers: WtTableHeader[];
	/**
	 * Sortable columns, keyed by header `value`, with what each one sorts by.
	 * A column not listed here is not sortable.
	 */
	sortValues?: Partial<Record<string, (row: Row) => LocalTableSortValue>>;
	/** Order while no column is sorted, and between rows a sorted column ties. */
	defaultCompare?: (first: Row, second: Row) => number;
	/** The text a row is searched by; no search without it. */
	searchValue?: (row: Row) => string | undefined;
	/** Rows added per page as the table is scrolled. */
	pageSize?: number;
}
