import { describe, expect, it } from 'vitest';

import {
	MISSED_CALLS_SORT,
	type MissedCallsColumnHeader,
} from '../../types/MissedCallsTable.types';
import { applySortToHeaders, buildSortQuery } from '../missedCallsSortAdapter';

const buildHeaders = (): MissedCallsColumnHeader[] => [
	{
		value: 'name',
		field: 'contact.name',
		sort: MISSED_CALLS_SORT.NONE,
	},
	{
		value: 'phoneNumber',
	},
	{
		value: 'createdAt',
		field: 'created_at',
		sort: MISSED_CALLS_SORT.NONE,
	},
];

describe('buildSortQuery', () => {
	it('returns an empty string when no column is sorted', () => {
		expect(buildSortQuery(buildHeaders())).toBe('');
	});

	it('builds "+field" for ascending sort, using the column field over its value', () => {
		const headers = applySortToHeaders(
			buildHeaders(),
			{
				value: 'name',
			},
			MISSED_CALLS_SORT.ASC,
		);

		expect(buildSortQuery(headers)).toBe('+contact.name');
	});

	it('builds "-field" for descending sort', () => {
		const headers = applySortToHeaders(
			buildHeaders(),
			{
				value: 'createdAt',
			},
			MISSED_CALLS_SORT.DESC,
		);

		expect(buildSortQuery(headers)).toBe('-created_at');
	});
});

describe('applySortToHeaders', () => {
	it('resets every other sortable column back to NONE', () => {
		let headers = applySortToHeaders(
			buildHeaders(),
			{
				value: 'name',
			},
			MISSED_CALLS_SORT.ASC,
		);
		headers = applySortToHeaders(
			headers,
			{
				value: 'createdAt',
			},
			MISSED_CALLS_SORT.ASC,
		);

		const name = headers.find((header) => header.value === 'name');
		const createdAt = headers.find((header) => header.value === 'createdAt');

		expect(name?.sort).toBe(MISSED_CALLS_SORT.NONE);
		expect(createdAt?.sort).toBe(MISSED_CALLS_SORT.ASC);
	});

	it('leaves non-sortable columns untouched', () => {
		const headers = applySortToHeaders(
			buildHeaders(),
			{
				value: 'name',
			},
			MISSED_CALLS_SORT.ASC,
		);

		const phoneNumber = headers.find(
			(header) => header.value === 'phoneNumber',
		);
		expect(phoneNumber?.sort).toBeUndefined();
	});
});
