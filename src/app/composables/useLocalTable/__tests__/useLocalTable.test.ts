import { SortSymbols } from '@webitel/ui-sdk/scripts';
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useLocalTable } from '../useLocalTable';

interface Row {
	id: string;
	name?: string;
	startedAt?: number;
}

const headers = [
	{
		value: 'name',
		field: 'name',
	},
	{
		value: 'startedAt',
		field: 'startedAt',
	},
	{
		value: 'note',
		field: 'note',
	},
];

const sortValues = {
	name: (row: Row) => row.name,
	startedAt: (row: Row) => row.startedAt,
};

const byStartedAt = (first: Row, second: Row) =>
	(first.startedAt ?? 0) - (second.startedAt ?? 0);

const ids = (rows: Row[]) => rows.map((row) => row.id);

const buildRows = (count: number): Row[] =>
	Array.from(
		{
			length: count,
		},
		(_, index) => ({
			id: `r${index + 1}`,
			name: `Chat ${index + 1}`,
			startedAt: index + 1,
		}),
	);

describe('useLocalTable', () => {
	describe('sort', () => {
		const rows: Row[] = [
			{
				id: 'b',
				name: 'bob',
				startedAt: 1,
			},
			{
				id: 'empty',
				startedAt: 2,
			},
			{
				id: 'a',
				name: 'Alice',
				startedAt: 3,
			},
		];

		it('makes only the columns with a sort value sortable', () => {
			const table = useLocalTable({
				rows,
				headers,
				sortValues,
			});

			expect(table.headers.value.map((header) => header.sort)).toEqual([
				SortSymbols.NONE,
				SortSymbols.NONE,
				undefined,
			]);
		});

		it('starts sorted by a sortable column given a sort', () => {
			const table = useLocalTable({
				rows,
				headers: [
					{
						...headers[0],
						sort: SortSymbols.DESC,
					},
					{
						...headers[2],
						sort: SortSymbols.ASC,
					},
				],
				sortValues,
			});

			expect(table.headers.value.map((header) => header.sort)).toEqual([
				SortSymbols.DESC,
				undefined,
			]);
			expect(ids(table.dataList.value)).toEqual([
				'b',
				'a',
				'empty',
			]);
		});

		it('keeps the default order while no column is sorted', () => {
			const table = useLocalTable({
				rows: [
					...rows,
				].reverse(),
				headers,
				sortValues,
				defaultCompare: byStartedAt,
			});

			expect(ids(table.dataList.value)).toEqual([
				'b',
				'empty',
				'a',
			]);
		});

		it('sorts text case-insensitively, empty values last both ways', () => {
			const table = useLocalTable({
				rows,
				headers,
				sortValues,
			});
			const [nameHeader] = table.headers.value;

			table.updateSort(nameHeader, SortSymbols.ASC);
			expect(ids(table.dataList.value)).toEqual([
				'a',
				'b',
				'empty',
			]);

			table.updateSort(nameHeader, SortSymbols.DESC);
			expect(ids(table.dataList.value)).toEqual([
				'b',
				'a',
				'empty',
			]);
		});

		it('marks one column sorted at a time', () => {
			const table = useLocalTable({
				rows,
				headers,
				sortValues,
			});
			const [nameHeader, startedAtHeader] = table.headers.value;

			table.updateSort(nameHeader, SortSymbols.ASC);
			table.updateSort(startedAtHeader, SortSymbols.DESC);

			expect(table.headers.value.map((header) => header.sort)).toEqual([
				SortSymbols.NONE,
				SortSymbols.DESC,
				undefined,
			]);
		});

		it('goes back to the default order when the sort is cleared', () => {
			const table = useLocalTable({
				rows,
				headers,
				sortValues,
				defaultCompare: byStartedAt,
			});
			const [nameHeader] = table.headers.value;

			table.updateSort(nameHeader, SortSymbols.ASC);
			table.updateSort(nameHeader, SortSymbols.NONE);

			expect(ids(table.dataList.value)).toEqual([
				'b',
				'empty',
				'a',
			]);
		});

		it('breaks ties by the default order', () => {
			const table = useLocalTable({
				rows: [
					{
						id: 'later',
						name: 'Same',
						startedAt: 2,
					},
					{
						id: 'earlier',
						name: 'same',
						startedAt: 1,
					},
				],
				headers,
				sortValues,
				defaultCompare: byStartedAt,
			});

			table.updateSort(table.headers.value[0], SortSymbols.DESC);

			expect(ids(table.dataList.value)).toEqual([
				'earlier',
				'later',
			]);
		});
	});

	describe('search', () => {
		const rows: Row[] = [
			{
				id: 'john',
				name: 'John Smith',
			},
			{
				id: 'jane',
				name: 'Jane Doe',
			},
			{
				id: 'empty',
			},
		];

		it('matches part of the text, ignoring case and outer spaces', () => {
			const table = useLocalTable({
				rows,
				headers,
				searchValue: (row) => row.name,
			});

			table.setSearch('  SMI ');

			expect(ids(table.dataList.value)).toEqual([
				'john',
			]);
		});

		it('shows every row for an empty query', () => {
			const table = useLocalTable({
				rows,
				headers,
				searchValue: (row) => row.name,
			});

			table.setSearch('   ');

			expect(table.dataList.value).toHaveLength(3);
		});
	});

	describe('paging', () => {
		it('shows one page and adds the next on loadMore', () => {
			const table = useLocalTable({
				rows: buildRows(5),
				headers,
				pageSize: 2,
			});

			expect(ids(table.dataList.value)).toEqual([
				'r1',
				'r2',
			]);
			expect(table.hasMore.value).toBe(true);

			table.loadMore();
			table.loadMore();

			expect(table.dataList.value).toHaveLength(5);
			expect(table.hasMore.value).toBe(false);
		});

		it('does not run past the last page', () => {
			const rows = ref(buildRows(3));
			const table = useLocalTable({
				rows,
				headers,
				pageSize: 2,
			});

			table.loadMore();
			table.loadMore();
			table.loadMore();
			rows.value = buildRows(10);

			expect(table.dataList.value).toHaveLength(4);
		});

		it('starts again from the first page on search and sort', () => {
			const table = useLocalTable({
				rows: buildRows(5),
				headers,
				sortValues,
				searchValue: (row) => row.name,
				pageSize: 2,
			});

			table.loadMore();
			table.setSearch('chat');
			expect(table.dataList.value).toHaveLength(2);

			table.loadMore();
			table.updateSort(table.headers.value[0], SortSymbols.ASC);
			expect(table.dataList.value).toHaveLength(2);
		});

		it('keeps the page when new rows arrive', () => {
			const rows = ref(buildRows(5));
			const table = useLocalTable({
				rows,
				headers,
				pageSize: 2,
			});

			table.loadMore();
			rows.value = buildRows(6);

			expect(table.dataList.value).toHaveLength(4);
		});
	});
});
