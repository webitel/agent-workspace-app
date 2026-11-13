import { type Ref, ref, watch } from 'vue';

import { searchQueues } from '../../../../../features/queues/api/searchQueues';
import { toTransferQueueRow } from '../scripts/toTransferQueueRow';
import type { TransferQueueRow } from '../types/CallTransfer.types';

const QUEUES_PAGE_SIZE = 20;

/**
 * @author Oleksandr Palonnyi
 * TODO: the Agents tab now lists through a ui-datalist table store
 * (docs/adr/0016-transfer-agents-list.md); move the Queues tab onto the same
 * pattern and drop this composable (docs/adr/0018-transfer-queues-list.md)
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export function useTransferQueueList(search: Ref<string>) {
	const rows = ref<TransferQueueRow[]>([]);
	const isLoading = ref(false);
	const hasNextPage = ref(false);

	let loadedPage = 0;
	let latestRequestId = 0;

	/**
	 * @author Oleksandr Palonnyi
	 * a slow answer to an old search must not overwrite the newer one, so only
	 * the latest request is applied. The API layer already raises the error
	 * notification, so a failure only stops further paging, otherwise the
	 * list would retry the same failing page on every scroll
	 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
	 */
	async function loadPage(page: number): Promise<void> {
		latestRequestId += 1;
		const requestId = latestRequestId;
		isLoading.value = true;

		try {
			const { items, next } = await searchQueues({
				search: search.value,
				page,
				size: QUEUES_PAGE_SIZE,
			});
			if (requestId !== latestRequestId) return;

			rows.value = [
				...(page === 1 ? [] : rows.value),
				...items.map(toTransferQueueRow),
			];
			loadedPage = page;
			hasNextPage.value = next;
		} catch {
			if (requestId !== latestRequestId) return;
			hasNextPage.value = false;
		} finally {
			if (requestId === latestRequestId) isLoading.value = false;
		}
	}

	function loadNextPage(): Promise<void> | undefined {
		if (isLoading.value || !hasNextPage.value) return undefined;
		return loadPage(loadedPage + 1);
	}

	watch(
		search,
		() => {
			rows.value = [];
			hasNextPage.value = false;
			return loadPage(1);
		},
		{
			immediate: true,
		},
	);

	return {
		rows,
		isLoading,
		hasNextPage,

		loadNextPage,
	};
}
