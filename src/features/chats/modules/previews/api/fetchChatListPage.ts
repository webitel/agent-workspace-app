import { type IThread, ThreadTag } from '@webitel/chat-web-sdk';

import { threadsService } from '../../../api/chatSdk';
import { ChatListTab } from '../enums/ChatListTab.enum';

export const CHAT_LIST_PAGE_SIZE = 20;

// the spec gives the left panel no order; newest activity first is assumed
// (ADR-0012), to be confirmed against what `updated_at` follows
const CHAT_LIST_SORT = '-updated_at';

// a row is drawn from its task; the thread brings only what the task lacks
const CHAT_LIST_FIELDS = [
	'id',
	'updated_at',
	'last_msg',
	'unread_count',
];

export interface ChatListPageQuery {
	tab: ChatListTab;
	/** The agent's listed chats; a page never reaches past them. */
	threadIds: string[];
	query: string;
	onlyUnread: boolean;
	/** 1-based. */
	page: number;
}

export interface ChatListPageResult {
	threads: IThread[];
	next: boolean;
}

/**
 * Reads one page of a chat list tab from the chat backend, scoped to the
 * agent's call-center chats (ADR-0012).
 */
export async function fetchChatListPage({
	tab,
	threadIds,
	query,
	onlyUnread,
	page,
}: ChatListPageQuery): Promise<ChatListPageResult> {
	// without ids the backend answers every thread of the agent, internal ones
	// included, so an agent with no chats is answered here
	if (!threadIds.length)
		return {
			threads: [],
			next: false,
		};

	const isSnoozedTab = tab === ChatListTab.Snoozed;
	const snoozed = [
		ThreadTag.Snoozed,
	];

	const { items, next } = await threadsService.fetchThreads({
		ids: threadIds,
		tags: isSnoozedTab ? snoozed : undefined,
		excludeTags: isSnoozedTab ? undefined : snoozed,
		// the Snoozed tab has no unread filter of its own (AC_02.02.04)
		unread: !isSnoozedTab && onlyUnread ? true : undefined,
		q: query || undefined,
		sort: CHAT_LIST_SORT,
		fields: CHAT_LIST_FIELDS,
		page,
		size: CHAT_LIST_PAGE_SIZE,
	});

	return {
		threads: items ?? [],
		next: Boolean(next),
	};
}
