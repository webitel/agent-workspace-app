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

import ChatsPageActionPanel from '../chats-page-action-panel.vue';

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

const mountPanel = () => {
	const store = createStore();
	const wrapper = mount(ChatsPageActionPanel, {
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
		search: wrapper.findComponent({
			name: 'DynamicFilterSearch',
		}),
	};
};

describe('chats-page-action-panel', () => {
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
