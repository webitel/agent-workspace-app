import { beforeEach, describe, expect, it, vi } from 'vitest';

const getListMock = vi.fn();
const redialMock = vi.fn();

vi.mock('@webitel/api-services/api', () => ({
	CallHistoryAPI: {
		getList: (...args: unknown[]) => getListMock(...args),
		redial: (...args: unknown[]) => redialMock(...args),
	},
}));

vi.mock('../../../../../userinfo/stores/userinfoStore', () => ({
	useUserinfoStore: () => ({
		userId: 'agent-1',
	}),
}));

import { getMissedCalls, redialMissedCall } from '../missedCallsAPI';

describe('getMissedCalls', () => {
	beforeEach(() => {
		getListMock.mockClear();
		getListMock.mockResolvedValue({
			items: [],
			next: false,
		});
	});

	it('scopes the request to missed calls owned by the current agent', async () => {
		await getMissedCalls({
			page: 2,
			sort: '+created_at',
			search: 'jane',
		});

		expect(getListMock).toHaveBeenCalledWith(
			expect.objectContaining({
				missed: true,
				ownerId: [
					'agent-1',
				],
				page: 2,
				sort: '+created_at',
				search: 'jane',
			}),
		);
	});
});

describe('redialMissedCall', () => {
	it('calls the caller back through CallHistoryAPI.redial', async () => {
		await redialMissedCall('call-1');

		expect(redialMock).toHaveBeenCalledWith({
			callId: 'call-1',
		});
	});
});
