import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getListMock = vi.fn();

vi.mock('@webitel/api-services/api', () => ({
	ServiceCatalogsAPI: {
		getList: (...args: unknown[]) => getListMock(...args),
	},
}));

import ProcessingFormSelectService from '../fields/processing-form-select-service.vue';

const catalogs = [
	{
		id: 1,
		name: 'Billing',
		service: [
			{
				id: 10,
				name: 'Refunds',
				service: [
					{
						id: 100,
						name: 'Card refund',
						description: 'Refund to the original card',
					},
				],
			},
		],
	},
];

const stubs = {
	'wt-icon': true,
	'wt-icon-btn': true,
	'wt-loader': {
		template: '<div class="loader" />',
	},
	'wt-expansion-panel': {
		template:
			'<section><header class="title"><slot name="title" /></header><slot /></section>',
	},
	'wt-search-bar': {
		name: 'SearchBar',
		props: [
			'value',
		],
		emits: [
			'input',
			'search',
		],
		template: '<input class="search" />',
	},
	'wt-tree': {
		name: 'Tree',
		props: [
			'modelValue',
			'data',
		],
		emits: [
			'update:modelValue',
		],
		template: '<div class="tree" />',
	},
};

const mountSelect = (props: Record<string, unknown> = {}) =>
	mount(ProcessingFormSelectService, {
		props,
		global: {
			stubs,
			directives: {
				tooltip: {},
			},
		},
	});

describe('processing-form-select-service', () => {
	beforeEach(() => {
		getListMock.mockReset();
		getListMock.mockResolvedValue({
			items: catalogs,
		});
	});

	it('loads every active catalog with its services', async () => {
		mountSelect();
		await flushPromises();

		expect(getListMock).toHaveBeenCalledWith(
			expect.objectContaining({
				size: -1,
				search: '',
				hasSubservices: true,
				state: true,
			}),
		);
	});

	it('titles itself with the schema header until something is selected', async () => {
		expect(mountSelect().find('.title').text()).toBe('Select a service');

		const wrapper = mountSelect({
			table: {
				headerTitle: 'Topic',
			},
		});
		await flushPromises();
		expect(wrapper.find('.title').text()).toBe('Topic');
	});

	it('shows the full path of a seeded service once catalogs load', async () => {
		const wrapper = mountSelect({
			modelValue: {
				id: 100,
				name: 'Card refund',
			},
		});
		await flushPromises();

		expect(wrapper.find('.title').text()).toBe(
			'Billing / Refunds / Card refund',
		);
		expect(
			wrapper
				.findComponent({
					name: 'Tree',
				})
				.props('modelValue'),
		).toBe(100);
	});

	it('re-emits the picked service id', async () => {
		const wrapper = mountSelect();
		await flushPromises();

		await wrapper
			.findComponent({
				name: 'Tree',
			})
			.vm.$emit('update:modelValue', 10);

		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
			10,
		]);
	});

	it('reloads with the search term', async () => {
		const wrapper = mountSelect();
		await flushPromises();
		const searchBar = wrapper.findComponent({
			name: 'SearchBar',
		});

		await searchBar.vm.$emit('input', 'refund');
		await searchBar.vm.$emit('search');
		await flushPromises();

		expect(getListMock).toHaveBeenLastCalledWith(
			expect.objectContaining({
				search: 'refund',
			}),
		);
	});
});
