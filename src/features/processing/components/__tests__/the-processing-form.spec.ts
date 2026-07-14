import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import type { ProcessingFormData } from '../../types/ProcessingForm.types';
import ProcessingFormDatetimepicker from '../fields/processing-form-datetimepicker.vue';
import ProcessingFormInputText from '../fields/processing-form-input-text.vue';
import ProcessingFormSelect from '../fields/processing-form-select.vue';
import TheProcessingForm from '../the-processing-form.vue';

vi.mock('vue-i18n', () => ({
	useI18n: () => ({
		t: (key: string) => key,
	}),
}));

const globalStubs = {
	'wt-single-select': true,
	'wt-multi-select': true,
	'wt-input-text': true,
	'wt-datepicker': true,
	'wt-button': {
		template:
			'<button class="wt-button-stub" @click="$emit(\'click\')"><slot /></button>',
	},
};

function makeTask(form: ProcessingFormData) {
	const task = {
		hasForm: true,
		form,
		formAction: vi.fn(() => Promise.resolve({})),
	} as Record<string, unknown>;
	Object.defineProperty(task, 'attempt', {
		get: () => task,
	});
	return task;
}

function mountForm(form: ProcessingFormData) {
	const task = makeTask(form);
	const wrapper = mount(TheProcessingForm, {
		props: {
			task: task as never,
		},
		global: {
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
			],
		});

		expect(wrapper.findComponent(ProcessingFormSelect).exists()).toBe(true);
		expect(wrapper.findComponent(ProcessingFormInputText).exists()).toBe(true);
		expect(wrapper.findComponent(ProcessingFormDatetimepicker).exists()).toBe(
			true,
		);
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
});
