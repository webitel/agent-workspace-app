import type { DatalistTableHeader } from '@webitel/ui-datalist';
import type { MaybeRef } from 'vue';
import { computed, reactive, ref, toValue } from 'vue';

export interface TableActionPanelStore {
	headers: MaybeRef<DatalistTableHeader[]>;
	loadDataList: (options?: { withLoading?: boolean }) => Promise<void>;
	hasFilter: (name: string) => boolean;
	addFilter: (params: { name: string; value: string }) => unknown;
	updateFilter: (params: { name: string; value: string }) => unknown;
	deleteFilter: (params: { name: string }) => unknown;
	updateShownHeaders: (headers: DatalistTableHeader[]) => void;
}

export function useTableActionPanel(tableStore: TableActionPanelStore) {
	const {
		loadDataList,
		hasFilter,
		addFilter,
		updateFilter,
		deleteFilter,
		updateShownHeaders,
	} = tableStore;
	const headers = computed(() => toValue(tableStore.headers));

	const searchValue = ref('');

	const handleSearch = (value: string) => {
		if (!value) {
			if (hasFilter('search'))
				deleteFilter({
					name: 'search',
				});
			return;
		}
		hasFilter('search')
			? updateFilter({
					name: 'search',
					value,
				})
			: addFilter({
					name: 'search',
					value,
				});
	};

	const refresh = () => loadDataList();

	// reactive() so nested refs (searchValue, headers) auto-unwrap for
	// consumers binding directly to `actionPanel.searchValue` in a template
	return reactive({
		searchValue,
		headers,
		handleSearch,
		refresh,
		updateShownHeaders,
	});
}
