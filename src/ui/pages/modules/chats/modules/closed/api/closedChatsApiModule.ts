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
 * source, queue, startedAt, endedAt, duration and message. They are never
 * approximated from `createdAt` or `lastMsg`, which describe the whole thread,
 * not the agent's membership period.
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

const toClosedChatRow =
	(userId: string) =>
	(thread: WebitelImApiGatewayV1Thread): ClosedChatRow => {
		const client = findClientContact(thread.members, userId);

		return {
			id: thread.id ?? '',
			name: client?.name || client?.username || '',
			username: client?.username ?? '',
			thread: thread as ThreadModel,
		};
	};

/**
 * Adapts datalist table store params to ThreadManagement.SearchLeft, which
 * takes paging only: no search text, no sort.
 *
 * A thread a task backs is an active chat (ADR-0009), offered or accepted, so
 * it is dropped from the closed ones: the chat window treats it the same way.
 */
const getList = async (params: Record<string, unknown> = {}) => {
	const { page, size, userId, taskThreadIds } = params;

	const activeThreadIds = new Set(taskThreadIds as string[] | undefined);

	const listResponseHandler = (items: WebitelImApiGatewayV1Thread[]) =>
		items
			.filter((thread) => !activeThreadIds.has(thread.id ?? ''))
			.map(toClosedChatRow(String(userId)));

	try {
		const response =
			await getWebitelImApiGatewayV1Threadmanagement().threadManagementSearchLeft(
				{
					page: page as number | undefined,
					size: size as number | undefined,
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
