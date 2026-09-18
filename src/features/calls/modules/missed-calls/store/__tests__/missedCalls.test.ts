import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMissedCallsMock = vi.fn();
const redialMissedCallMock = vi.fn();

vi.mock('../../api/missedCallsAPI', () => ({
	getMissedCalls: (...args: unknown[]) => getMissedCallsMock(...args),
	redialMissedCall: (...args: unknown[]) => redialMissedCallMock(...args),
}));

import { MISSED_CALLS_SORT } from '../../types/MissedCallsTable.types';
import { useMissedCallsStore } from '../missedCalls';

const buildCall = (id: string) => ({
	id,
	destination: `phone-${id}`,
	createdAt: '2026-01-01T10:00:00Z',
	duration: 10,
});

describe('useMissedCallsStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		getMissedCallsMock.mockReset();
		redialMissedCallMock.mockReset();
	});

	it('loads the first page on initialize', async () => {
		getMissedCallsMock.mockResolvedValue({
			items: [
				buildCall('1'),
			],
			next: true,
		});

		const store = useMissedCallsStore();
		await store.initialize();

		expect(store.rows).toHaveLength(1);
		expect(store.rows[0].id).toBe('1');
		expect(store.hasMore).toBe(true);
		expect(getMissedCallsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				page: 1,
			}),
		);
	});

	it('appends the next page on loadMore and stops when the server has no more', async () => {
		getMissedCallsMock.mockResolvedValueOnce({
			items: [
				buildCall('1'),
			],
			next: true,
		});
		const store = useMissedCallsStore();
		await store.initialize();

		getMissedCallsMock.mockResolvedValueOnce({
			items: [
				buildCall('2'),
			],
			next: false,
		});
		await store.loadMore();

		expect(store.rows.map((row) => row.id)).toEqual([
			'1',
			'2',
		]);
		expect(store.hasMore).toBe(false);
		expect(getMissedCallsMock).toHaveBeenLastCalledWith(
			expect.objectContaining({
				page: 2,
			}),
		);

		await store.loadMore();
		expect(getMissedCallsMock).toHaveBeenCalledTimes(2);
	});

	it('resets to page 1 and sends the sort query when a column is sorted', async () => {
		getMissedCallsMock.mockResolvedValue({
			items: [
				buildCall('1'),
			],
			next: false,
		});
		const store = useMissedCallsStore();
		await store.initialize();
		getMissedCallsMock.mockClear();

		await store.applySort(
			{
				value: 'createdAt',
				field: 'created_at',
			},
			MISSED_CALLS_SORT.ASC,
		);

		expect(getMissedCallsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				page: 1,
				sort: '+created_at',
			}),
		);
	});

	it('resets to page 1 and sends the query on setSearch', async () => {
		getMissedCallsMock.mockResolvedValue({
			items: [],
			next: false,
		});
		const store = useMissedCallsStore();
		await store.initialize();
		getMissedCallsMock.mockClear();

		await store.setSearch('jane');

		expect(store.search).toBe('jane');
		expect(getMissedCallsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				page: 1,
				search: 'jane',
			}),
		);
	});

	it('redials through the API', async () => {
		const store = useMissedCallsStore();
		await store.redial('call-1');

		expect(redialMissedCallMock).toHaveBeenCalledWith('call-1');
	});
});
