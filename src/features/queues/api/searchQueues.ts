import { QueuesAPI } from '@webitel/api-services/api';
import { QueueType } from '@webitel/ui-sdk/enums';

export interface SearchedQueue {
	id: string;
	name?: string;
	description?: string;
}

export interface SearchQueuesResult {
	items: SearchedQueue[];
	next: boolean;
}

/**
 * @author Oleksandr Palonnyi
 * only inbound queues are listed, as in cc-workspaces: a call can be handed
 * to them. The list API has no `enabled` filter, so a disabled queue is not
 * left out here (open question in docs/claude/calls.md). Only the fields a
 * list row shows are requested
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export async function searchQueues({
	search,
	page,
	size,
}: {
	search: string;
	page: number;
	size: number;
}): Promise<SearchQueuesResult> {
	return QueuesAPI.getList({
		search,
		page,
		size,
		queueType: QueueType.INBOUND_QUEUE,
		fields: [
			'id',
			'name',
			'description',
		],
	});
}
