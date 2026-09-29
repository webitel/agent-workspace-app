import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ProcessingFormRichText from '../fields/processing-form-rich-text.vue';

const editorStub = {
	name: 'WtRichTextEditor',
	props: [
		'modelValue',
		'label',
		'labelProps',
		'output',
		'height',
	],
	emits: [
		'update:modelValue',
	],
	template: '<div class="editor" />',
};

const mountField = (props: Record<string, unknown>) =>
	mount(ProcessingFormRichText, {
		props,
		global: {
			stubs: {
				'wt-rich-text-editor': editorStub,
			},
		},
	});

const editor = (wrapper: ReturnType<typeof mountField>) =>
	wrapper.findComponent(editorStub);

describe('processing-form-rich-text', () => {
	it('hands the editor its schema settings', () => {
		const wrapper = mountField({
			modelValue: '<p>Hi</p>',
			label: 'Summary',
			labelProps: {
				hint: 'Visible to the customer',
			},
			output: 'text',
			height: 200,
		});

		expect(editor(wrapper).props()).toMatchObject({
			modelValue: '<p>Hi</p>',
			label: 'Summary',
			labelProps: {
				hint: 'Visible to the customer',
			},
			output: 'text',
			height: 200,
		});
	});

	it('gives the editor a string, whatever the seed was', () => {
		expect(
			editor(
				mountField({
					modelValue: 42,
				}),
			).props('modelValue'),
		).toBe('42');
		expect(editor(mountField({})).props('modelValue')).toBe('');
	});

	it('re-emits what the agent wrote', async () => {
		const wrapper = mountField({
			modelValue: '',
		});

		await editor(wrapper).vm.$emit('update:modelValue', '<p>Done</p>');

		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
			'<p>Done</p>',
		]);
	});
});
