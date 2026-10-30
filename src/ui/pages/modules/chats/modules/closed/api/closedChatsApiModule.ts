import { getDefaultGetListResponse } from '@webitel/api-services/api/defaults';
import {
	applyTransform,
	merge,
	notify,
	snakeToCamel,
	translateError,
} from '@webitel/api-services/api/transformers';
import type { WebitelImApiGatewayV1Thread } from '@webitel/api-services/gen/models';
import { getWebitelImApiGatewayV1Threadmanagement } from '@webitel/api-services/gen-wire';
import type { ThreadModel } from '@webitel/chat-web-sdk';
import type { ApiModule } from '@webitel/ui-sdk/api/types/ApiModule';

import { findClientContact } from '../../../../../../../features/chats/scripts/findClientContact';

/**
 * Columns the backend does not return for a left thread yet stay empty:
 * startedAt, endedAt, duration and message. They are never approximated from
 * `createdAt` or `lastMsg`, which describe the whole thread, not the agent's
 * membership period.
 */
export interface ClosedChatRow {
	id: string;
	name: string;
	username: string;
	source?: string;
	queue?: string;
	startedAt?: number;
	endedAt?: number;
	duration?: number;
	message?: string;
	thread: ThreadModel;
}

const toClosedChatRow = (
	thread: WebitelImApiGatewayV1Thread,
): ClosedChatRow => {
	const client = findClientContact(thread.members);

	return {
		id: thread.id ?? '',
		name: client?.name || client?.username || '',
		username: client?.username ?? '',
		source: thread.channel?.name || undefined,
		queue: thread.queue?.name || undefined,
		thread: thread as ThreadModel,
	};
};

/**
 * The only keys ThreadManagement.SearchLeft sorts by that the table has a
 * column for: source (the channel) and queue, by name.
 */
const SORTABLE_FIELDS = new Set([
	'channel_name',
	'queue_name',
]);

const toApiSort = (sort?: string) =>
	sort && SORTABLE_FIELDS.has(sort.replace(/^[+-]/, '')) ? sort : undefined;

/**
 * Adapts datalist table store params to ThreadManagement.SearchLeft, which
 * takes paging and a sort, but no search text.
 *
 * A thread a task backs is an active chat (ADR-0010), offered or accepted, so
 * it is dropped from the closed ones: the chat window treats it the same way.
 */
const getList = async (params: Record<string, unknown> = {}) => {
	const { page, size, sort, taskThreadIds } = params;

	const activeThreadIds = new Set(taskThreadIds as string[] | undefined);

	const listResponseHandler = (items: WebitelImApiGatewayV1Thread[]) =>
		items
			.filter((thread) => !activeThreadIds.has(thread.id ?? ''))
			.map(toClosedChatRow);

	try {
		const response =
			await getWebitelImApiGatewayV1Threadmanagement().threadManagementSearchLeft(
				{
					page: page as number | undefined,
					size: size as number | undefined,
					sort: toApiSort(sort as string | undefined),
				},
			);

		const { items, next } = applyTransform(response.data, [
			// variables are the user's own names and values: kept as sent, as in the
			// SDK's Threads.api
			snakeToCamel([
				'variables',
			]),
			merge(getDefaultGetListResponse()),
		]);

		return {
			items: applyTransform(items, [
				listResponseHandler,
			]),
			next,
		};
	} catch (err) {
		throw applyTransform(err, [
			translateError,
			notify,
		]);
	}
};

export const closedChatsApiModule = {
	getList,
} satisfies ApiModule<ClosedChatRow>;
