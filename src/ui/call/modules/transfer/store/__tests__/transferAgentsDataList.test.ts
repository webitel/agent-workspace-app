import { createTestingPinia } from '@pinia/testing';
import { flushPromises } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAgentsListMock = vi.fn();

vi.mock('@webitel/api-services/api', () => ({
	AgentsAPI: {
		getList: (...args: unknown[]) => getAgentsListMock(...args),
	},
}));

vi.mock('../../../../../../features/userinfo/stores/userinfoStore', () => ({
	useUserinfoStore: () => ({
		userId: 'me',
	}),
}));

import { useTransferAgentsDataListStore } from '../transferAgentsDataList';

describe('useTransferAgentsDataListStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		getAgentsListMock.mockReset();
		getAgentsListMock.mockResolvedValue({
			items: [],
			next: false,
		});
	});

	it('searches agents without the agent themself, with the presence for the status column', async () => {
		const store = useTransferAgentsDataListStore();
		await store.setupStore();
		store.addFilter({
			name: 'search',
			value: 'jo',
		});
		await flushPromises();

		expect(getAgentsListMock).toHaveBeenCalledTimes(1);
		expect(getAgentsListMock).toHaveBeenCalledWith(
			expect.objectContaining({
				search: 'jo',
				page: 1,
				notUserId: [
					'me',
				],
				fields: expect.arrayContaining([
					'id',
					'name',
					'status',
					'team',
					'user_presence_status',
				]),
			}),
		);
	});

	it('holds the agents as transfer rows', async () => {
		getAgentsListMock.mockResolvedValue({
			items: [
				{
					id: '7',
					name: 'John Doe',
				},
			],
			next: false,
		});
		const store = useTransferAgentsDataListStore();
		await store.setupStore();
		store.addFilter({
			name: 'search',
			value: '',
		});
		await flushPromises();

		expect(store.dataList).toEqual([
			expect.objectContaining({
				id: '7',
				name: 'John Doe',
			}),
		]);
	});
});
