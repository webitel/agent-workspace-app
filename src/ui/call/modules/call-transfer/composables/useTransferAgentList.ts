import { type Ref, ref, watch } from 'vue';

import { searchAgents } from '../../../../../features/agents/api/searchAgents';
import { useUserinfoStore } from '../../../../../features/userinfo/stores/userinfoStore';
import { toTransferAgentRow } from '../scripts/toTransferAgentRow';
import type { TransferAgentRow } from '../types/CallTransfer.types';

const AGENTS_PAGE_SIZE = 20;

export function useTransferAgentList(search: Ref<string>) {
	const userinfoStore = useUserinfoStore();

	const rows = ref<TransferAgentRow[]>([]);
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
			const { items, next } = await searchAgents({
				search: search.value,
				page,
				size: AGENTS_PAGE_SIZE,
				excludedUserIds: [
					userinfoStore.userId,
				],
			});
			if (requestId !== latestRequestId) return;

			rows.value = [
				...(page === 1 ? [] : rows.value),
				...items.map(toTransferAgentRow),
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
