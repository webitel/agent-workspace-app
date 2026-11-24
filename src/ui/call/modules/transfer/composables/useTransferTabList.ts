import { type ComputedRef, computed, onUnmounted, type Ref, watch } from 'vue';

const SEARCH_FILTER_NAME = 'search';

/**
 * @author Oleksandr Palonnyi
 * the actions of a ui-datalist table store a transfer tab drives. Its state
 * comes separately, as refs from storeToRefs: the store's declared type has
 * its state as refs, while the Pinia store it is at runtime unwraps them, so
 * reading the state off the store would type-check and fail
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export interface TransferTabListStoreActions {
	setupStore(): Promise<void>;
	appendToDataList(): Promise<void>;
	addFilter(params: { name: string; value: string }): unknown;
	$reset(): void;
}

/**
 * @author Oleksandr Palonnyi
 * the loading and row selection every tab list of the transfer popup shares;
 * a tab component keeps only its store and its cells.
 * The first page is loaded by the store's own filter watcher, which reloads
 * from page 1 whenever a filter changes once the store is set up. Adding the
 * search filter after setupStore is that change, so every mount loads exactly
 * once; `initialize` would load as well and, on a remount, race the watcher.
 * The store is a singleton and the popup opens many times, so it is reset on
 * unmount, which also drops the search filter for the next mount to add.
 * addFilter replaces a filter of the same name, so a search typed while the
 * store is still being set up needs no separate path (ADR-0016)
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export function useTransferTabList<
	Row extends {
		id: string;
	},
>({
	store,
	dataList,
	isLoading,
	next,
	search,
	selectedRowId,
}: {
	store: TransferTabListStoreActions;
	dataList: Ref<Row[]>;
	isLoading: Ref<boolean>;
	next: Ref<boolean>;
	search: () => string;
	selectedRowId: Ref<string | null>;
}): {
	selectedRow: ComputedRef<Row | null>;
	onLoading: () => Promise<void>;
	onRowClick: (event: { data: Row }) => void;
} {
	function applySearch(searchText: string): void {
		store.addFilter({
			name: SEARCH_FILTER_NAME,
			value: searchText,
		});
	}

	async function loadFirstPage(): Promise<void> {
		await store.setupStore();
		applySearch(search());
	}

	async function onLoading(): Promise<void> {
		if (isLoading.value || !next.value) return;
		await store.appendToDataList();
	}

	watch(search, applySearch);

	loadFirstPage();

	onUnmounted(() => store.$reset());

	/**
	 * @author Oleksandr Palonnyi
	 * wt-table paints its active row itself (ui-sdk >= 26.12.26), so the
	 * selected row needs no token or class of the table's own, see ADR-0027
	 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
	 */
	const selectedRow = computed(
		() => dataList.value.find((row) => row.id === selectedRowId.value) ?? null,
	);

	/**
	 * @author Oleksandr Palonnyi
	 * a second click on the selected row clears the selection, as AC_13.07.10
	 * describes for the Users tab; it is applied to every tab so they behave alike
	 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
	 */
	function onRowClick({ data: row }: { data: Row }): void {
		selectedRowId.value = selectedRowId.value === row.id ? null : row.id;
	}

	return {
		selectedRow,
		onLoading,
		onRowClick,
	};
}
