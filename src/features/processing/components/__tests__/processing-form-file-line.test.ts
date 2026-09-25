import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ProcessingFormFileLine from '../fields/processing-form-file-line.vue';

const stubs = {
	'wt-icon': {
		props: [
			'icon',
		],
		template: '<i class="icon" :data-icon="icon" />',
	},
	'wt-icon-btn': {
		props: [
			'icon',
		],
		template: '<button class="icon-btn" :data-icon="icon" />',
	},
	'wt-load-bar': {
		props: [
			'value',
			'max',
		],
		template: '<progress class="load-bar" :value="value" :max="max" />',
	},
};

const file = {
	id: 5,
	name: 'contract.pdf',
	mime: 'application/pdf',
	size: 2048,
};

const upload = (overrides = {}) => ({
	key: 'u1',
	file,
	loaded: 512,
	total: 2048,
	done: false,
	failed: false,
	...overrides,
});

const mountLine = (props: Record<string, unknown>) =>
	mount(ProcessingFormFileLine, {
		props: {
			file,
			...props,
		},
		global: {
			stubs,
		},
	});

describe('processing-form-file-line', () => {
	it('links a stored file and offers to delete it', async () => {
		const wrapper = mountLine({
			href: 'https://files/5',
		});

		expect(wrapper.find('a').attributes('href')).toBe('https://files/5');
		expect(wrapper.find('.icon').attributes('data-icon')).toBe(
			'preview-tag-application',
		);

		await wrapper.find('[data-icon="bucket"]').trigger('click');
		expect(wrapper.emitted('delete')).toHaveLength(1);
	});

	it('shows progress while uploading', () => {
		const bar = mountLine({
			upload: upload(),
		}).find('.load-bar');

		expect(bar.attributes('value')).toBe('512');
		expect(bar.attributes('max')).toBe('2048');
	});

	it('marks a failed upload and lets it be dismissed', async () => {
		const wrapper = mountLine({
			upload: upload({
				failed: true,
			}),
		});

		expect(wrapper.text()).toContain('Upload failed');
		await wrapper.find('[data-icon="close"]').trigger('click');
		expect(wrapper.emitted('dismiss')).toHaveLength(1);
	});

	it('offers no actions when read-only', () => {
		const wrapper = mountLine({
			readonly: true,
		});

		expect(wrapper.find('.icon-btn').exists()).toBe(false);
	});
});
