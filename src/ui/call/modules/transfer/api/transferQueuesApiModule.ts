import { QueuesAPI } from '@webitel/api-services/api';
import { QueueType } from '@webitel/ui-sdk/enums';

import type {
	TransferQueueRow,
	TransferQueueSource,
} from '../types/CallTransfer.types';

interface TransferQueuesResponse {
	items?: TransferQueueSource[];
	next?: boolean;
}

function toTransferQueueRow(queue: TransferQueueSource): TransferQueueRow {
	return {
		id: queue.id,
		name: queue.name ?? '',
		description: queue.description ?? '',
	};
}

/**
 * @author Oleksandr Palonnyi
 * only inbound queues are listed, as in cc-workspaces: a call can be handed
 * to them. The list API has no `enabled` filter, so a disabled queue is not
 * left out here (docs/adr/0018-transfer-queues-list.md)
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const transferQueuesApiModule = {
	getList: async (
		params: Record<string, unknown> = {},
	): Promise<{
		items: TransferQueueRow[];
		next: boolean;
	}> => {
		const response: TransferQueuesResponse = await QueuesAPI.getList({
			...params,
			queueType: QueueType.INBOUND_QUEUE,
		});

		return {
			items: (response.items ?? []).map(toTransferQueueRow),
			next: !!response.next,
		};
	},
};
