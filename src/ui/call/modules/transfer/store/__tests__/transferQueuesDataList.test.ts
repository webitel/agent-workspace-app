import { createTestingPinia } from '@pinia/testing';
import { QueueType } from '@webitel/ui-sdk/enums';
import { flushPromises } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getQueuesListMock = vi.fn();

vi.mock('@webitel/api-services/api', () => ({
	QueuesAPI: {
		getList: (...args: unknown[]) => getQueuesListMock(...args),
	},
}));

import { useTransferQueuesDataListStore } from '../transferQueuesDataList';

describe('useTransferQueuesDataListStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		getQueuesListMock.mockReset();
		getQueuesListMock.mockResolvedValue({
			items: [],
			next: false,
		});
	});

	it('searches inbound queues by name, requesting only the fields a row shows', async () => {
		const store = useTransferQueuesDataListStore();
		await store.setupStore();
		store.addFilter({
			name: 'search',
			value: 'sup',
		});
		await flushPromises();

		expect(getQueuesListMock).toHaveBeenCalledTimes(1);
		expect(getQueuesListMock).toHaveBeenCalledWith(
			expect.objectContaining({
				search: 'sup',
				page: 1,
				queueType: QueueType.INBOUND_QUEUE,
				fields: expect.arrayContaining([
					'id',
					'name',
					'description',
				]),
			}),
		);
	});

	it('appends the next page when the previous one reported more', async () => {
		getQueuesListMock.mockResolvedValueOnce({
			items: [
				{
					id: '1',
					name: 'First',
				},
			],
			next: true,
		});
		getQueuesListMock.mockResolvedValueOnce({
			items: [
				{
					id: '2',
					name: 'Second',
				},
			],
			next: false,
		});
		const store = useTransferQueuesDataListStore();
		await store.setupStore();
		store.addFilter({
			name: 'search',
			value: '',
		});
		await flushPromises();
		await store.appendToDataList();
		await flushPromises();

		expect(getQueuesListMock).toHaveBeenLastCalledWith(
			expect.objectContaining({
				page: 2,
			}),
		);
		expect(store.dataList).toEqual([
			expect.objectContaining({
				id: '1',
			}),
			expect.objectContaining({
				id: '2',
			}),
		]);
		expect(store.next).toBe(false);
	});

	it('holds the queues as transfer rows, with an empty description when there is none', async () => {
		getQueuesListMock.mockResolvedValue({
			items: [
				{
					id: '7',
					name: 'Support',
				},
			],
			next: false,
		});
		const store = useTransferQueuesDataListStore();
		await store.setupStore();
		store.addFilter({
			name: 'search',
			value: '',
		});
		await flushPromises();

		expect(store.dataList).toEqual([
			{
				id: '7',
				name: 'Support',
				description: '',
			},
		]);
	});
});
