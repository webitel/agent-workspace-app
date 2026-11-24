import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, type Ref, ref } from 'vue';

import { useTransferTabList } from '../useTransferTabList';

interface TestRow {
	id: string;
}

function createStore() {
	return {
		setupStore: vi.fn().mockResolvedValue(undefined),
		appendToDataList: vi.fn().mockResolvedValue(undefined),
		addFilter: vi.fn(),
		$reset: vi.fn(),
	};
}

function mountTabList({
	store = createStore(),
	dataList = ref<TestRow[]>([]),
	isLoading = ref(false),
	next = ref(false),
	search = ref(''),
	selectedRowId = ref<string | null>(null),
}: {
	store?: ReturnType<typeof createStore>;
	dataList?: Ref<TestRow[]>;
	isLoading?: Ref<boolean>;
	next?: Ref<boolean>;
	search?: Ref<string>;
	selectedRowId?: Ref<string | null>;
} = {}) {
	let tabList: ReturnType<typeof useTransferTabList<TestRow>>;
	const wrapper = mount(
		defineComponent({
			setup() {
				tabList = useTransferTabList<TestRow>({
					store,
					dataList,
					isLoading,
					next,
					search: () => search.value,
					selectedRowId,
				});
				return () => null;
			},
		}),
	);

	return {
		wrapper,
		store,
		search,
		selectedRowId,
		get tabList() {
			return tabList;
		},
	};
}

describe('useTransferTabList', () => {
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		store = createStore();
	});

	it('adds the search filter once the store is set up', async () => {
		mountTabList({
			store,
			search: ref('jo'),
		});
		expect(store.addFilter).not.toHaveBeenCalled();

		await flushPromises();

		expect(store.setupStore).toHaveBeenCalledTimes(1);
		expect(store.addFilter).toHaveBeenCalledWith({
			name: 'search',
			value: 'jo',
		});
	});

	it('applies a changed search to the filter', async () => {
		const { search } = mountTabList({
			store,
		});
		await flushPromises();

		search.value = 'ann';
		await nextTick();

		expect(store.addFilter).toHaveBeenLastCalledWith({
			name: 'search',
			value: 'ann',
		});
	});

	it('appends the next page only when there is one and nothing is loading', async () => {
		const isLoading = ref(false);
		const next = ref(false);
		const { tabList } = mountTabList({
			store,
			isLoading,
			next,
		});

		await tabList.onLoading();
		expect(store.appendToDataList).not.toHaveBeenCalled();

		next.value = true;
		isLoading.value = true;
		await tabList.onLoading();
		expect(store.appendToDataList).not.toHaveBeenCalled();

		isLoading.value = false;
		await tabList.onLoading();
		expect(store.appendToDataList).toHaveBeenCalledTimes(1);
	});

	it('resets the store on unmount', () => {
		const { wrapper } = mountTabList({
			store,
		});

		wrapper.unmount();

		expect(store.$reset).toHaveBeenCalledTimes(1);
	});

	it('selects a clicked row and resolves it from the list', () => {
		const { tabList, selectedRowId } = mountTabList({
			store,
			dataList: ref([
				{
					id: '1',
				},
				{
					id: '2',
				},
			]),
		});

		tabList.onRowClick({
			data: {
				id: '2',
			},
		});

		expect(selectedRowId.value).toBe('2');
		expect(tabList.selectedRow.value).toEqual({
			id: '2',
		});
	});

	it('clears the selection on a second click on the selected row (AC_13.07.10)', () => {
		const { tabList, selectedRowId } = mountTabList({
			store,
			selectedRowId: ref<string | null>('2'),
		});

		tabList.onRowClick({
			data: {
				id: '2',
			},
		});

		expect(selectedRowId.value).toBeNull();
	});

	it('has no selected row when the selected id is not in the list', () => {
		const { tabList } = mountTabList({
			store,
			dataList: ref([
				{
					id: '1',
				},
			]),
			selectedRowId: ref<string | null>('9'),
		});

		expect(tabList.selectedRow.value).toBeNull();
	});
});
