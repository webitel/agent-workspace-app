import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { reactive, ref } from 'vue';

// the real filters entry point pulls in the library i18n setup
vi.mock('@webitel/ui-datalist/filters', () => ({
	DynamicFilterSearchComponent: {
		name: 'DynamicFilterSearch',
		props: {
			filtersManager: null,
			isFiltersRestoring: null,
			collapsible: Boolean,
			placeholder: null,
		},
		emits: [
			'filter:add',
			'filter:update',
			'filter:delete',
		],
		template: '<div class="filter-search" />',
	},
}));

import CallsPageActionPanel from '../calls-page-action-panel.vue';

const stubs = {
	TableActionPanel: {
		name: 'TableActionPanel',
		template: '<div class="table-action-panel"><slot /></div>',
	},
};

const filtersManager = {
	filters: [],
};

const createStore = () =>
	reactive({
		filtersManager: ref(filtersManager),
		isFiltersRestoring: ref(true),
		addFilter: vi.fn(),
		updateFilter: vi.fn(),
		deleteFilter: vi.fn(),
	});

const mountPanel = (props: { searchPlaceholder?: string } = {}) => {
	const store = createStore();
	const wrapper = mount(CallsPageActionPanel, {
		props: {
			// only the part of the datalist store the panel uses
			store: store as never,
			...props,
		},
		global: {
			stubs,
		},
	});

	return {
		store,
		search: wrapper.findComponent({
			name: 'DynamicFilterSearch',
		}),
	};
};

describe('calls-page-action-panel', () => {
	it('connects the search to the store filters', () => {
		const { search, store } = mountPanel();

		expect(search.props()).toEqual({
			filtersManager,
			isFiltersRestoring: true,
			collapsible: true,
			placeholder: undefined,
		});

		search.vm.$emit('filter:add', 'added');
		search.vm.$emit('filter:update', 'updated');
		search.vm.$emit('filter:delete', 'deleted');

		expect(store.addFilter).toHaveBeenCalledWith('added');
		expect(store.updateFilter).toHaveBeenCalledWith('updated');
		expect(store.deleteFilter).toHaveBeenCalledWith('deleted');
	});

	it('passes the search placeholder to the search', () => {
		const { search } = mountPanel({
			searchPlaceholder: 'Search by number',
		});

		expect(search.props('placeholder')).toBe('Search by number');
	});
});
