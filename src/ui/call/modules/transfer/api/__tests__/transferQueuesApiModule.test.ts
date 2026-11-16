import { QueueType } from '@webitel/ui-sdk/enums';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getQueuesListMock = vi.fn();

vi.mock('@webitel/api-services/api', () => ({
	QueuesAPI: {
		getList: (...args: unknown[]) => getQueuesListMock(...args),
	},
}));

import { transferQueuesApiModule } from '../transferQueuesApiModule';

describe('transferQueuesApiModule', () => {
	beforeEach(() => {
		getQueuesListMock.mockReset();
	});

	it('always asks for inbound queues, whatever the caller passes', async () => {
		getQueuesListMock.mockResolvedValue({
			items: [],
		});

		await transferQueuesApiModule.getList({
			search: 'sup',
			queueType: QueueType.OFFLINE_QUEUE,
		});

		expect(getQueuesListMock).toHaveBeenCalledWith(
			expect.objectContaining({
				search: 'sup',
				queueType: QueueType.INBOUND_QUEUE,
			}),
		);
	});

	it('maps queues to rows and keeps the next flag', async () => {
		getQueuesListMock.mockResolvedValue({
			items: [
				{
					id: '7',
					name: 'Support',
					description: 'Tier 1',
				},
			],
			next: true,
		});

		expect(await transferQueuesApiModule.getList()).toEqual({
			items: [
				{
					id: '7',
					name: 'Support',
					description: 'Tier 1',
				},
			],
			next: true,
		});
	});

	it('returns no rows and no next page when the response has neither', async () => {
		getQueuesListMock.mockResolvedValue({});

		expect(await transferQueuesApiModule.getList()).toEqual({
			items: [],
			next: false,
		});
	});
});
