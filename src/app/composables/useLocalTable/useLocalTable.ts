import type {
	WtTableHeader,
	WtTableSortOrder,
} from '@webitel/ui-sdk/components/wt-table/types/WtTable';
import { SortSymbols } from '@webitel/ui-sdk/scripts';
import { computed, readonly, ref, toValue } from 'vue';

import type {
	LocalTableSortValue,
	UseLocalTableOptions,
} from './types/LocalTable.types';

const DEFAULT_PAGE_SIZE = 20;

const collator = new Intl.Collator(undefined, {
	numeric: true,
	sensitivity: 'base',
});

const isEmpty = (value: LocalTableSortValue) =>
	value === undefined || value === '';

function compareSortValues(
	first: LocalTableSortValue,
	second: LocalTableSortValue,
	direction: 1 | -1,
) {
	if (isEmpty(first) && isEmpty(second)) return 0;
	// empty values stay at the bottom whichever way the column is sorted
	if (isEmpty(first)) return 1;
	if (isEmpty(second)) return -1;

	const order =
		typeof first === 'number' && typeof second === 'number'
			? first - second
			: collator.compare(String(first), String(second));
	return direction * order;
}

/**
 * A `wt-table` over rows the app already holds (a socket feed, say) rather
 * than over a REST list: search, sort and paging on scroll all run on the
 * client. What it returns is named as `createTableStore` (@webitel/ui-datalist)
 * names it, so a table reads the same whichever of the two backs it.
 *
 * Search and sort start again from the first page; new rows arriving do not,
 * so a feed updating does not throw the agent back to the top.
 */
export function useLocalTable<Row>({
	rows,
	headers: initialHeaders,
	sortValues = {},
	defaultCompare,
	searchValue,
	pageSize = DEFAULT_PAGE_SIZE,
}: UseLocalTableOptions<Row>) {
	// `sort: undefined` is "not sortable" to wt-table, `NONE` is "sortable,
	// unsorted"; a sortable header may come already sorted, as the default
	const headers = ref<WtTableHeader[]>(
		initialHeaders.map((header) => ({
			...header,
			sort: sortValues[header.value]
				? (header.sort ?? SortSymbols.NONE)
				: undefined,
		})),
	);
	const shownHeaders = computed(() =>
		headers.value.filter((header) => header.show !== false),
	);

	const search = ref('');
	const page = ref(1);

	const filteredRows = computed(() => {
		const allRows = toValue(rows);
		const query = search.value.trim().toLocaleLowerCase();
		if (!query || !searchValue) return allRows;

		return allRows.filter(
			(row) => searchValue(row)?.toLocaleLowerCase().includes(query) ?? false,
		);
	});

	const sortedHeader = computed(() =>
		headers.value.find(
			(header) =>
				header.sort === SortSymbols.ASC || header.sort === SortSymbols.DESC,
		),
	);

	const sortedRows = computed(() => {
		const header = sortedHeader.value;
		const getSortValue = header && sortValues[header.value];

		if (!getSortValue)
			return defaultCompare
				? [
						...filteredRows.value,
					].sort(defaultCompare)
				: filteredRows.value;

		const direction = header.sort === SortSymbols.ASC ? 1 : -1;
		return [
			...filteredRows.value,
		].sort(
			(first, second) =>
				compareSortValues(
					getSortValue(first),
					getSortValue(second),
					direction,
				) ||
				(defaultCompare?.(first, second) ?? 0),
		);
	});

	const dataList = computed(() =>
		sortedRows.value.slice(0, page.value * pageSize),
	);
	const hasMore = computed(
		() => sortedRows.value.length > dataList.value.length,
	);

	/** Takes `wt-table`'s `@sort` as is: the column and its next order. */
	function updateSort(column: WtTableHeader, order: WtTableSortOrder) {
		headers.value = headers.value.map((header) =>
			header.sort === undefined
				? header
				: {
						...header,
						sort: header.value === column.value ? order : SortSymbols.NONE,
					},
		);
		page.value = 1;
	}

	function setSearch(value: string) {
		search.value = value;
		page.value = 1;
	}

	/**
	 * Safe to call on every lazy-load event: `wt-table` fires one on each
	 * scroll range recalculation, not only near the bottom.
	 */
	function loadMore() {
		if (hasMore.value) page.value += 1;
	}

	return {
		// state
		headers,
		search: readonly(search),

		// getters
		shownHeaders,
		dataList,
		hasMore,

		// actions
		updateSort,
		setSearch,
		loadMore,
	};
}
