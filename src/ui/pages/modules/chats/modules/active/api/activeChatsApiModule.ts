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
import type { ApiModule } from '@webitel/ui-sdk/api/types/ApiModule';

import { findClientContact } from '../../../../../../../features/chats/scripts/findClientContact';

const DEFAULT_SORT = '+created_at';

/**
 * Duration is counted from `created_at`, so a longer duration
 * means an earlier `created_at`.
 */
const SORT_ALIASES: Record<string, string> = {
	'+duration': '-created_at',
	'-duration': '+created_at',
};

/**
 * Columns are built from several thread fields, so the request always
 * asks for the full set instead of the table's column fields.
 */
const API_FIELDS = [
	'id',
	'created_at',
	'members',
	'last_msg',
];

export interface ActiveChatRow {
	id: string;
	name: string;
	username: string;
	message: string;
	startedAt: number;
	duration: number;
}

/**
 * Duration is fixed at load time and is not updated live.
 */
const toActiveChatRow =
	(loadedAt: number) =>
	(thread: WebitelImApiGatewayV1Thread): ActiveChatRow => {
		const client = findClientContact(thread.members);
		const startedAt = Number(thread.createdAt);

		return {
			id: thread.id ?? '',
			name: client?.name || client?.username || '',
			username: client?.username ?? '',
			message: thread.lastMsg?.body ?? '',
			startedAt,
			duration: Math.floor((loadedAt - startedAt) / 1000),
		};
	};

const toApiSort = (sort?: string) =>
	sort ? (SORT_ALIASES[sort] ?? sort) : DEFAULT_SORT;

/**
 * Adapts datalist table store params to ThreadManagement.Search.
 */
const getList = async (params: Record<string, unknown> = {}) => {
	const { page, size, sort, search } = params;

	const listResponseHandler = (items: WebitelImApiGatewayV1Thread[]) =>
		items.map(toActiveChatRow(Date.now()));

	try {
		const response =
			await getWebitelImApiGatewayV1Threadmanagement().threadManagementSearch({
				page: page as number | undefined,
				size: size as number | undefined,
				q: (search as string | undefined) || undefined,
				sort: toApiSort(sort as string | undefined),
				fields: API_FIELDS,
			});

		const { items, next } = applyTransform(response.data, [
			snakeToCamel(),
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

export const activeChatsApiModule = {
	getList,
} satisfies ApiModule<ActiveChatRow>;
