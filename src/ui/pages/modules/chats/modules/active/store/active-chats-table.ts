import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed } from 'vue';

import { useLocalTable } from '../../../../../../../app/composables/useLocalTable/useLocalTable';
import { useChatListStore } from '../../../../../../../features/chats/modules/previews/store/chat-list';
import { useChatPreviewsStore } from '../../../../../../../features/chats/modules/previews/store/chat-previews';
import { useChatsStore } from '../../../../../../../features/chats/store/chats';
import { ActiveChatsColumn } from '../enums/ActiveChatsColumn.enum';
import { toActiveChatRow } from '../scripts/toActiveChatRow';
import type { ActiveChatRow } from '../types/ActiveChatRow.types';
import { headers } from './_internals/headers';

/**
 * Oldest accepted chat first: the order while no column is sorted, and between
 * rows a sorted column ties. A chat with no accept time goes last.
 */
const byBridgedAt = (first: ActiveChatRow, second: ActiveChatRow) => {
	if (first.bridgedAt === second.bridgedAt) return 0;
	if (first.bridgedAt === undefined) return 1;
	if (second.bridgedAt === undefined) return -1;
	return first.bridgedAt - second.bridgedAt;
};

/**
 * The Active tab's table (US_02.06): the agent's accepted chats, from the
 * socket task feed rather than a REST list, so search, sort and paging run on
 * the client (`useLocalTable`).
 *
 * Started at and Duration both come from the accept time (`bridgedAt`). Source
 * and Username have no sort value: nothing fills them yet, and sorting by an
 * empty column would only shuffle the rows.
 */
export const useActiveChatsTableStore = defineStore(
	'active-chats-table',
	() => {
		const chatsStore = useChatsStore();
		const previewsStore = useChatPreviewsStore();
		// the chat list keeps the previews' last messages in step with the agent's
		// chats; this table reads them too, and must not depend on the list being
		// on screen
		useChatListStore();

		const rows = computed(() =>
			chatsStore.chatTaskList.flatMap(
				(task) =>
					toActiveChatRow(
						task,
						previewsStore.lastMessages[task.thread?.id ?? ''],
					) ?? [],
			),
		);

		return useLocalTable<ActiveChatRow>({
			rows,
			headers,
			sortValues: {
				[ActiveChatsColumn.Name]: (row) => row.name,
				[ActiveChatsColumn.Queue]: (row) => row.queueName,
				[ActiveChatsColumn.StartedAt]: (row) => row.bridgedAt,
				// the longer a chat has run, the earlier it was accepted
				[ActiveChatsColumn.Duration]: (row) =>
					row.bridgedAt === undefined ? undefined : -row.bridgedAt,
			},
			defaultCompare: byBridgedAt,
			searchValue: (row) => row.name,
		});
	},
);

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useActiveChatsTableStore, import.meta.hot),
	);
}
