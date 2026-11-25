import { beforeEach, describe, expect, it, vi } from 'vitest';

const getListMock = vi.fn();

vi.mock('@webitel/api-services/api', () => ({
	AgentsAPI: {
		getList: (...args: unknown[]) => getListMock(...args),
	},
}));

vi.mock('@webitel/api-services/api/transformers', () => ({
	applyTransform: (response: unknown) => response,
}));

import { transferAgentsApiModule } from '../transferAgentsApiModule';

describe('transferAgentsApiModule', () => {
	beforeEach(() => {
		getListMock.mockReset();
		getListMock.mockResolvedValue({
			items: [],
		});
	});

	it('leaves out the given user through notUserId', async () => {
		await transferAgentsApiModule.getList({
			notUserId: 'user-1',
		});

		expect(getListMock).toHaveBeenCalledWith(
			expect.objectContaining({
				notUserId: [
					'user-1',
				],
			}),
		);
	});

	it('sends no notUserId when none is given, not a list holding undefined', async () => {
		await transferAgentsApiModule.getList();

		expect(getListMock.mock.calls[0][0].notUserId).toBeUndefined();
	});

	it('always requests the presence status', async () => {
		await transferAgentsApiModule.getList({
			fields: [
				'id',
			],
		});

		expect(getListMock.mock.calls[0][0].fields).toEqual([
			'id',
			'user_presence_status',
		]);
	});
});
