import { useIntervalFn } from '@vueuse/core';
import { storeToRefs } from 'pinia';

import { offlineMembersApiModule } from '../api/offlineMembersApiModule';
import type { useOfflineCallsDataListStore } from '../store/offline-calls';

const REFRESH_INTERVAL = 15 * 1000;

/**
 * There are no socket events on offline queue changes, so the list is polled.
 * `loadDataList` would reload only the current page and drop the pages
 * appended on scroll, so every loaded row is re-requested as one page instead.
 */
export const useOfflineCallsAutoRefresh = (
	store: ReturnType<typeof useOfflineCallsDataListStore>,
) => {
	const { dataList, isLoading, filtersManager, sort, size, next } =
		storeToRefs(store);

	const refresh = async () => {
		if (document.hidden || isLoading.value) return;

		const listAtStart = dataList.value;
		const lengthAtStart = listAtStart.length;

		try {
			const response = await offlineMembersApiModule.getList({
				...filtersManager.value.getAllValues(),
				sort: sort.value,
				page: 1,
				size: Math.max(lengthAtStart, size.value),
			});

			// the list was reloaded, appended or is loading while we waited
			const isStale =
				isLoading.value ||
				dataList.value !== listAtStart ||
				dataList.value.length !== lengthAtStart;
			if (isStale) return;

			dataList.value = response.items;
			next.value = response.next;
		} catch {
			// background refresh only: the next tick retries
		}
	};

	useIntervalFn(refresh, REFRESH_INTERVAL);
};
