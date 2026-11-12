import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@webitel/ui-sdk/components', () => ({
	WtSearchBar: {
		name: 'WtSearchBar',
		props: [
			'value',
			'searchMode',
			'searchModeOptions',
		],
		emits: [
			'input',
			'search',
			'update:search-mode',
		],
		template: '<div />',
	},
}));

import { ContactSearchMode } from '../../../../../features/calls/modules/contact/enums/ContactSearchMode.enum';
import ContactSearch from '../contact-search.vue';

const mountSearch = (
	props: { query?: string; searchMode?: ContactSearchMode } = {},
) =>
	mount(ContactSearch, {
		props,
	});

const findBar = (wrapper: ReturnType<typeof mountSearch>) =>
	wrapper.findComponent({
		name: 'WtSearchBar',
	});

describe('contact-search', () => {
	it('lists Name, Destination and Attribute to search by, Name first', () => {
		const wrapper = mountSearch();

		expect(findBar(wrapper).props('searchModeOptions')).toEqual([
			{
				value: 'name',
				text: 'ui.sidebar.contact.search.modes.name',
			},
			{
				value: 'destination',
				text: 'ui.sidebar.contact.search.modes.destination',
			},
			{
				value: 'attribute',
				text: 'ui.sidebar.contact.search.modes.attribute',
			},
		]);
		expect(findBar(wrapper).props('searchMode')).toBe(ContactSearchMode.Name);
	});

	it('emits the typed query with the chosen mode', async () => {
		const wrapper = mountSearch({
			searchMode: ContactSearchMode.Destination,
		});

		findBar(wrapper).vm.$emit('search', '+1202');

		expect(wrapper.emitted('search')).toEqual([
			[
				{
					query: '+1202',
					searchMode: ContactSearchMode.Destination,
				},
			],
		]);
	});

	it('searches again by the new mode when there is a query', async () => {
		const wrapper = mountSearch({
			query: 'role=vip',
		});

		findBar(wrapper).vm.$emit('update:search-mode', {
			value: ContactSearchMode.Attribute,
		});

		expect(wrapper.emitted('search')).toEqual([
			[
				{
					query: 'role=vip',
					searchMode: ContactSearchMode.Attribute,
				},
			],
		]);
	});

	it('does not search when the mode changes with no query', async () => {
		const wrapper = mountSearch();

		findBar(wrapper).vm.$emit('update:search-mode', {
			value: ContactSearchMode.Attribute,
		});

		expect(wrapper.emitted('search')).toBeUndefined();
	});
});
