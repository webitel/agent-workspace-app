import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import type { ProcessingFormData } from '../../types/ProcessingForm.types';
import ProcessingFormCaseStatusSelect from '../fields/processing-form-case-status-select.vue';
import ProcessingFormDatetimepicker from '../fields/processing-form-datetimepicker.vue';
import ProcessingFormIFrame from '../fields/processing-form-i-frame.vue';
import ProcessingFormInputText from '../fields/processing-form-input-text.vue';
import ProcessingFormSelect from '../fields/processing-form-select.vue';
import ProcessingFormSelectFromObject from '../fields/processing-form-select-from-object.vue';
import ProcessingFormText from '../fields/processing-form-text.vue';
import TheProcessingForm from '../the-processing-form.vue';

const globalStubs = {
	'wt-single-select': true,
	'wt-multi-select': true,
	'wt-input-text': true,
	'wt-datepicker': true,
	'wt-icon': true,
	'wt-hint': true,
	'wt-copy-action': true,
	'wt-icon-btn': true,
	'wt-indicator': true,
	'wt-label': true,
	'wt-button': {
		props: [
			'disabled',
			'loading',
		],
		template:
			'<button class="wt-button-stub" :disabled="disabled" :data-loading="loading" @click="$emit(\'click\')"><slot /></button>',
	},
};

let nextId = 1;

type FormAction = () => Promise<object>;

function makeTask(
	form: ProcessingFormData,
	formAction = vi.fn<FormAction>(() => Promise.resolve({})),
) {
	return reactive({
		id: nextId++,
		hasForm: true,
		form,
		formAction,
	});
}

function mountForm(
	form: ProcessingFormData,
	formAction?: ReturnType<typeof vi.fn<FormAction>>,
) {
	const task = makeTask(form, formAction);
	const wrapper = mount(TheProcessingForm, {
		props: {
			task: task as never,
		},
		global: {
			plugins: [
				createTestingPinia({
					stubActions: false,
					createSpy: vi.fn,
				}),
			],
			stubs: globalStubs,
		},
	});
	return {
		wrapper,
		task,
	};
}

describe('the-processing-form', () => {
	it('dispatches each body element to the matching field component', () => {
		const { wrapper } = mountForm({
			title: '',
			metadata: {
				isInited: true,
			},
			actions: [],
			body: [
				{
					id: 'a',
					value: '',
					view: {
						component: 'wt-select',
						options: [],
					},
				},
				{
					id: 'b',
					value: '',
					view: {
						component: 'wt-input',
					},
				},
				{
					id: 'c',
					value: '',
					view: {
						component: 'wt-datetimepicker',
					},
				},
				{
					id: 'd',
					value: '',
					view: {
						component: 'form-text',
						initialValue: 'Read this first',
					},
				},
				{
					id: 'e',
					value: '',
					view: {
						component: 'form-select-case-status',
						options: [],
					},
				},
				{
					id: 'f',
					value: '',
					view: {
						component: 'form-select-from-object',
						object: {
							source: {
								path: '/objects',
							},
						},
					},
				},
				{
					id: 'g',
					value: '',
					view: {
						component: 'form-i-frame',
						initialValue: 'https://example.com',
					},
				},
			],
		});

		expect(wrapper.findComponent(ProcessingFormSelect).exists()).toBe(true);
		expect(wrapper.findComponent(ProcessingFormInputText).exists()).toBe(true);
		expect(wrapper.findComponent(ProcessingFormDatetimepicker).exists()).toBe(
			true,
		);
		expect(wrapper.findComponent(ProcessingFormText).exists()).toBe(true);
		expect(wrapper.findComponent(ProcessingFormCaseStatusSelect).exists()).toBe(
			true,
		);
		expect(wrapper.findComponent(ProcessingFormSelectFromObject).exists()).toBe(
			true,
		);
		expect(wrapper.findComponent(ProcessingFormIFrame).exists()).toBe(true);
	});

	it('renders a placeholder for an unsupported field type', () => {
		const { wrapper } = mountForm({
			title: '',
			metadata: {
				isInited: true,
			},
			actions: [],
			body: [
				{
					id: 'x',
					value: '',
					view: {
						component: 'form-table',
					},
				},
			],
		});

		expect(wrapper.find('.the-processing-form__unsupported').exists()).toBe(
			true,
		);
		expect(wrapper.findComponent(ProcessingFormSelect).exists()).toBe(false);
	});

	it('renders one action button per form action', () => {
		const { wrapper } = mountForm({
			title: '',
			metadata: {
				isInited: true,
			},
			actions: [
				{
					id: 'ok',
					view: {
						text: 'OK',
					},
				},
				{
					id: 'cancel',
					view: {
						text: 'Cancel',
					},
				},
			],
			body: [],
		});

		expect(wrapper.findAll('.wt-button-stub')).toHaveLength(2);
	});

	it('submits the action when its button is clicked', async () => {
		const { wrapper, task } = mountForm({
			title: '',
			metadata: {
				isInited: true,
			},
			actions: [
				{
					id: 'ok',
					view: {
						text: 'OK',
					},
				},
			],
			body: [
				{
					id: 'note',
					value: 'done',
					view: {
						component: 'wt-input',
					},
				},
			],
		});

		await wrapper.find('.wt-button-stub').trigger('click');

		expect(task.formAction).toHaveBeenCalledWith('ok', {
			note: 'done',
		});
	});

	it('locks every action and spins the clicked one while submitting', async () => {
		const { wrapper } = mountForm(
			{
				title: '',
				metadata: {
					isInited: true,
				},
				actions: [
					{
						id: 'ok',
						view: {
							text: 'OK',
						},
					},
					{
						id: 'cancel',
						view: {
							text: 'Cancel',
						},
					},
				],
				body: [],
			},
			vi.fn<FormAction>(() => new Promise(() => {})),
		);

		await wrapper.findAll('.wt-button-stub')[0].trigger('click');

		const [ok, cancel] = wrapper.findAll('.wt-button-stub');
		expect(ok.attributes('disabled')).toBeDefined();
		expect(cancel.attributes('disabled')).toBeDefined();
		expect(ok.attributes('data-loading')).toBe('true');
		expect(cancel.attributes('data-loading')).toBe('false');
	});
});
