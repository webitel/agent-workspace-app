import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ProcessingFormSelect from '../fields/processing-form-select.vue';

const stubs = {
	'wt-single-select': {
		template: '<div class="single" @reset="$emit(\'reset\')" />',
	},
	'wt-multi-select': {
		template: '<div class="multi" />',
	},
};

const options = [
	{
		value: 'a',
		name: 'A',
	},
	{
		value: 'b',
		name: 'B',
	},
];

describe('processing-form-select', () => {
	it('renders the single select by default and the multi select when multiple', () => {
		const single = mount(ProcessingFormSelect, {
			props: {
				modelValue: '',
				options,
			},
			global: {
				stubs,
			},
		});
		expect(single.find('.single').exists()).toBe(true);

		const multi = mount(ProcessingFormSelect, {
			props: {
				modelValue: [],
				options,
				multiple: true,
			},
			global: {
				stubs,
			},
		});
		expect(multi.find('.multi').exists()).toBe(true);
	});

	it('maps a primitive value to its option object and emits it', () => {
		const wrapper = mount(ProcessingFormSelect, {
			props: {
				modelValue: 'b',
				options,
			},
			global: {
				stubs,
			},
		});

		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
			{
				value: 'b',
				name: 'B',
			},
		]);
	});

	it('maps a primitive array to option objects', () => {
		const wrapper = mount(ProcessingFormSelect, {
			props: {
				modelValue: [
					'a',
					'b',
				],
				options,
				multiple: true,
			},
			global: {
				stubs,
			},
		});

		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
			[
				{
					value: 'a',
					name: 'A',
				},
				{
					value: 'b',
					name: 'B',
				},
			],
		]);
	});

	it('emits an empty string on reset', async () => {
		const wrapper = mount(ProcessingFormSelect, {
			props: {
				modelValue: {
					value: 'a',
					name: 'A',
				},
				options,
			},
			global: {
				stubs,
			},
		});

		await wrapper.find('.single').trigger('reset');

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([
			'',
		]);
	});
});
