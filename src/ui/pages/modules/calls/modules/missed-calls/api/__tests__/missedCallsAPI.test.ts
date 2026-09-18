import { beforeEach, describe, expect, it, vi } from 'vitest';

const getListMock = vi.fn();
const redialMock = vi.fn();

vi.mock('@webitel/api-services/api', () => ({
	CallHistoryAPI: {
		getList: (...args: unknown[]) => getListMock(...args),
		redial: (...args: unknown[]) => redialMock(...args),
	},
}));

vi.mock(
	'../../../../../../../../features/userinfo/stores/userinfoStore',
	() => ({
		useUserinfoStore: () => ({
			userId: 'agent-1',
		}),
	}),
);

import { getMissedCalls, redialMissedCall } from '../missedCallsAPI';

const buildCall = (id: string) => ({
	id,
	destination: `phone-${id}`,
	createdAt: '2026-01-01T10:00:00Z',
	duration: 10,
});

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

	it('falls back to the default page size when none is given', async () => {
		await getMissedCalls({
			page: 1,
		});

		expect(getListMock).toHaveBeenCalledWith(
			expect.objectContaining({
				size: 30,
			}),
		);
	});

	it('maps the returned items into table rows', async () => {
		getListMock.mockResolvedValue({
			items: [
				buildCall('1'),
			],
			next: true,
		});

		const { items, next } = await getMissedCalls({
			page: 1,
		});

		expect(items).toEqual([
			expect.objectContaining({
				id: '1',
				phoneNumber: 'phone-1',
			}),
		]);
		expect(next).toBe(true);
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
