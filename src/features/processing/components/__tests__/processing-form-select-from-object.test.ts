import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getObjectLookupMock = vi.fn((..._args: unknown[]) =>
	Promise.resolve({
		items: [],
		next: false,
	}),
);

vi.mock('../../api/objectLookup', () => ({
	getObjectLookup: (...args: unknown[]) => getObjectLookupMock(...args),
}));

import ProcessingFormSelectFromObject from '../fields/processing-form-select-from-object.vue';

const selectStub = (name: string) => ({
	name,
	props: [
		'label',
		'searchMethod',
		'modelValue',
	],
	template: `<div class="${name}" />`,
});

const stubs = {
	'wt-single-select': selectStub('single'),
	'wt-multi-select': selectStub('multi'),
};

const object = {
	source: {
		name: 'Cities',
		path: '/dictionary/cities',
	},
	displayColumn: 'title',
	filters: [
		'country=ua',
	],
	fields: [
		'id',
		'title',
	],
};

const mountSelect = (props: Record<string, unknown> = {}) =>
	mount(ProcessingFormSelectFromObject, {
		props: {
			object,
			...props,
		},
		global: {
			stubs,
		},
	});

describe('processing-form-select-from-object', () => {
	beforeEach(() => {
		getObjectLookupMock.mockClear();
	});

	it('labels itself after the object unless the form gives a label', () => {
		expect(
			mountSelect().findComponent(stubs['wt-single-select']).props('label'),
		).toBe('Cities');
		expect(
			mountSelect({
				label: 'City',
			})
				.findComponent(stubs['wt-single-select'])
				.props('label'),
		).toBe('City');
	});

	it('uses the multi select when multiple', () => {
		const wrapper = mountSelect({
			multiple: true,
		});

		expect(wrapper.find('.multi').exists()).toBe(true);
		expect(wrapper.find('.single').exists()).toBe(false);
	});

	it('searches the object source with the schema display, filters and fields', async () => {
		const searchMethod = mountSelect()
			.findComponent(stubs['wt-single-select'])
			.props('searchMethod') as (params: object) => Promise<unknown>;

		await searchMethod({
			search: 'kyi',
			page: 1,
		});

		expect(getObjectLookupMock).toHaveBeenCalledWith({
			search: 'kyi',
			page: 1,
			path: '/dictionary/cities',
			filters: [
				'country=ua',
			],
			fields: [
				'id',
				'title',
			],
			primary: 'id',
			display: 'title',
		});
	});
});
