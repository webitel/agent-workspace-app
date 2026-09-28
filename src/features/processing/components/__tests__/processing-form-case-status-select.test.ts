import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ProcessingFormCaseStatusSelect from '../fields/processing-form-case-status-select.vue';

const options = [
	{
		id: 1,
		name: 'New',
		initial: true,
	},
	{
		id: 2,
		name: 'In progress',
	},
	{
		id: 3,
		name: 'Resolved',
		final: true,
	},
];

// Renders both slots so the indicator colours can be asserted.
const stubs = {
	'wt-single-select': {
		props: [
			'modelValue',
			'options',
		],
		emits: [
			'update:modelValue',
		],
		template: `<div class="select" :data-value="modelValue">
			<slot name="value" />
			<slot v-for="option in options" name="option" :option="option" />
		</div>`,
	},
	'wt-indicator': {
		props: [
			'color',
			'text',
		],
		template: '<span class="indicator" :data-color="color">{{ text }}</span>',
	},
};

const mountSelect = (modelValue: unknown) =>
	mount(ProcessingFormCaseStatusSelect, {
		props: {
			modelValue: modelValue as never,
			options,
		},
		global: {
			stubs,
		},
	});

describe('processing-form-case-status-select', () => {
	it('selects by id whether seeded with the option object or the id', () => {
		expect(
			mountSelect(options[2]).find('.select').attributes('data-value'),
		).toBe('3');
		expect(mountSelect(2).find('.select').attributes('data-value')).toBe('2');
	});

	it('colours statuses as initial, final, or in between', () => {
		const colors = mountSelect(1)
			.findAll('.indicator')
			.map((indicator) => indicator.attributes('data-color'));

		// first is the selected value, then one per option
		expect(colors).toEqual([
			'initial-status',
			'initial-status',
			'other-status',
			'final-status',
		]);
	});

	it('re-emits the picked id', async () => {
		const wrapper = mountSelect(1);

		await wrapper
			.findComponent(stubs['wt-single-select'])
			.vm.$emit('update:modelValue', 3);

		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
			3,
		]);
	});
});
