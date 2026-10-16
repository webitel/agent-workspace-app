import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { reactive, ref } from 'vue';

// the real filters entry point pulls in the library i18n setup
vi.mock('@webitel/ui-datalist/filters', () => ({
	DynamicFilterSearchComponent: {
		name: 'DynamicFilterSearch',
		props: [
			'filtersManager',
			'isFiltersRestoring',
		],
		emits: [
			'filter:add',
			'filter:update',
			'filter:delete',
		],
		template: '<div class="filter-search" />',
	},
}));

import { TableActionPanelAction } from '../../../enums/TableActionPanelAction.enum';
import { CALLS_VARIABLE_HEADERS_STORAGE_KEY } from '../constants/storageKeys';
import HistoryPageActionPanel from '../history-page-action-panel.vue';

const stubs = {
	TableActionPanel: {
		name: 'TableActionPanel',
		props: [
			'actions',
			'headers',
			'staticHeaders',
			'variablesStorageKey',
		],
		emits: [
			'refresh',
			'update:headers',
		],
		template: '<div class="table-action-panel"><slot /></div>',
	},
};

const filtersManager = {
	filters: [],
};

const headers = [
	{
		value: 'createdAt',
	},
];

const createStore = () =>
	reactive({
		headers: ref(headers),
		filtersManager: ref(filtersManager),
		isFiltersRestoring: ref(true),
		addFilter: vi.fn(),
		updateFilter: vi.fn(),
		deleteFilter: vi.fn(),
		updateShownHeaders: vi.fn(),
		loadDataList: vi.fn(),
		updatePage: vi.fn(),
	});

const mountPanel = () => {
	const store = createStore();
	const wrapper = mount(HistoryPageActionPanel, {
		props: {
			// only the part of the datalist store the panel uses
			store: store as never,
		},
		global: {
			stubs,
		},
	});

	return {
		store,
		panel: wrapper.findComponent({
			name: 'TableActionPanel',
		}),
		search: wrapper.findComponent({
			name: 'DynamicFilterSearch',
		}),
	};
};

describe('history-page-action-panel', () => {
	it('configures the action panel for calls', () => {
		const { panel } = mountPanel();

		expect(panel.props()).toEqual({
			actions: [
				TableActionPanelAction.ColumnSelect,
				TableActionPanelAction.VariableColumnSelect,
				TableActionPanelAction.Refresh,
			],
			headers,
			staticHeaders: [
				'createdAt',
			],
			variablesStorageKey: CALLS_VARIABLE_HEADERS_STORAGE_KEY,
		});
	});

	it('reloads the list from the first page on refresh', () => {
		const { panel, store } = mountPanel();

		panel.vm.$emit('refresh');

		expect(store.updatePage).toHaveBeenCalledWith(1);
		expect(store.loadDataList).toHaveBeenCalledTimes(1);
		expect(store.updatePage.mock.invocationCallOrder[0]).toBeLessThan(
			store.loadDataList.mock.invocationCallOrder[0],
		);
	});

	it('saves the selected columns', () => {
		const { panel, store } = mountPanel();
		const selected = [
			{
				value: 'duration',
			},
		];

		panel.vm.$emit('update:headers', selected);

		expect(store.updateShownHeaders).toHaveBeenCalledWith(selected);
	});

	it('connects the search to the store filters', () => {
		const { search, store } = mountPanel();

		expect(search.props()).toEqual({
			filtersManager,
			isFiltersRestoring: true,
		});

		search.vm.$emit('filter:add', 'added');
		search.vm.$emit('filter:update', 'updated');
		search.vm.$emit('filter:delete', 'deleted');

		expect(store.addFilter).toHaveBeenCalledWith('added');
		expect(store.updateFilter).toHaveBeenCalledWith('updated');
		expect(store.deleteFilter).toHaveBeenCalledWith('deleted');
	});
});
