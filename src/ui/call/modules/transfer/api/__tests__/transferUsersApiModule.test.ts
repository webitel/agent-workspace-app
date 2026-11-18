import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUsersStatusMock = vi.fn();

vi.mock('@webitel/api-services/api', () => ({
	AgentsAPI: {
		getUsersStatus: (...args: unknown[]) => getUsersStatusMock(...args),
	},
}));

vi.mock('@webitel/api-services/api/transformers', () => ({
	applyTransform: (response: unknown) => response,
}));

import { transferUsersApiModule } from '../transferUsersApiModule';

describe('transferUsersApiModule', () => {
	beforeEach(() => {
		getUsersStatusMock.mockReset();
		getUsersStatusMock.mockResolvedValue({
			items: [],
		});
	});

	it('leaves out the given user through notUserId', async () => {
		await transferUsersApiModule.getList({
			notUserId: 'user-1',
		});

		expect(getUsersStatusMock).toHaveBeenCalledWith(
			expect.objectContaining({
				notUserId: [
					'user-1',
				],
			}),
		);
	});

	it('sends no notUserId when none is given, not a list holding undefined', async () => {
		await transferUsersApiModule.getList();

		expect(getUsersStatusMock.mock.calls[0][0].notUserId).toBeUndefined();
	});

	it('requests the extension and the presence next to the given fields', async () => {
		await transferUsersApiModule.getList({
			fields: [
				'id',
			],
		});

		expect(getUsersStatusMock.mock.calls[0][0].fields).toEqual([
			'id',
			'extension',
			'presence',
		]);
	});

	it('falls back to the position sort when the table sends none', async () => {
		await transferUsersApiModule.getList({
			sort: null,
		});

		expect(getUsersStatusMock.mock.calls[0][0].sort).toBe('position');
	});
});
