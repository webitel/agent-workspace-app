import { createTestingPinia } from '@pinia/testing';
import { flushPromises } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUsersStatusMock = vi.fn();

vi.mock('@webitel/api-services/api', () => ({
	AgentsAPI: {
		getUsersStatus: (...args: unknown[]) => getUsersStatusMock(...args),
	},
}));

vi.mock('../../../../../../features/userinfo/stores/userinfoStore', () => ({
	useUserinfoStore: () => ({
		userId: 'me',
	}),
}));

import { useTransferUsersDataListStore } from '../transferUsersDataList';

describe('useTransferUsersDataListStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		getUsersStatusMock.mockReset();
		getUsersStatusMock.mockResolvedValue({
			items: [],
			next: false,
		});
	});

	it('searches users without the user themself, with the presence and the extension', async () => {
		const store = useTransferUsersDataListStore();
		await store.setupStore();
		store.addFilter({
			name: 'search',
			value: 'jo',
		});
		await flushPromises();

		expect(getUsersStatusMock).toHaveBeenCalledTimes(1);
		expect(getUsersStatusMock).toHaveBeenCalledWith(
			expect.objectContaining({
				search: 'jo',
				page: 1,
				sort: 'position',
				notUserId: [
					'me',
				],
				fields: expect.arrayContaining([
					'id',
					'name',
					'status',
					'extension',
					'presence',
				]),
			}),
		);
	});

	it('holds the users as transfer rows', async () => {
		getUsersStatusMock.mockResolvedValue({
			items: [
				{
					id: '7',
					name: 'John Doe',
					extension: '1001',
				},
			],
			next: false,
		});
		const store = useTransferUsersDataListStore();
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
				extension: '1001',
			}),
		]);
	});
});
