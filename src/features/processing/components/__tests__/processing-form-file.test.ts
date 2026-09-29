import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storeFileMock = vi.fn();

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		getClient: () => ({
			storeFile: (...args: unknown[]) => storeFileMock(...args),
			fileUrlDownload: (id: number) => `https://files/${id}`,
		}),
	}),
}));

import ProcessingFormFile from '../fields/processing-form-file.vue';

const stubs = {
	'wt-icon': true,
	'wt-hint': true,
	'wt-load-bar': true,
	'wt-icon-btn': {
		props: [
			'icon',
		],
		template: '<button class="icon-btn" :data-icon="icon" />',
	},
	'wt-confirm-dialog': {
		props: [
			'callback',
		],
		template: '<div class="confirm" @click="callback()" />',
	},
};

const stored = (id: number, name = `file-${id}.txt`) => ({
	id,
	name,
	mime: 'text/plain',
	size: 10,
});

const mountField = (props: Record<string, unknown> = {}) =>
	mount(ProcessingFormFile, {
		props: {
			attemptId: 101,
			...props,
		},
		global: {
			stubs,
		},
	});

async function pickFiles(
	wrapper: ReturnType<typeof mountField>,
	names: string[],
) {
	const input = wrapper.find('input[type="file"]');
	Object.defineProperty(input.element, 'files', {
		value: names.map(
			(name) =>
				new File(
					[
						'x',
					],
					name,
				),
		),
		configurable: true,
	});
	await input.trigger('change');
}

describe('processing-form-file', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		storeFileMock.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('uploads against the attempt and adds the stored file once settled', async () => {
		storeFileMock.mockResolvedValue([
			stored(1),
		]);
		const wrapper = mountField();

		await pickFiles(wrapper, [
			'report.txt',
		]);
		await flushPromises();

		expect(storeFileMock).toHaveBeenCalledWith(
			'101',
			[
				expect.any(File),
			],
			expect.any(Function),
		);
		expect(wrapper.emitted('update:modelValue')).toBeUndefined();

		vi.advanceTimersByTime(1600);

		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
			[
				stored(1),
			],
		]);
	});

	it('uploads against the case when the form sets a channel', async () => {
		storeFileMock.mockResolvedValue([
			stored(1),
		]);
		const wrapper = mountField({
			channel: 'case',
			entityId: 'case-9',
		});

		await pickFiles(wrapper, [
			'report.txt',
		]);
		await flushPromises();

		expect(storeFileMock).toHaveBeenCalledWith(
			'case-9',
			[
				expect.any(File),
			],
			expect.any(Function),
			'case',
		);
	});

	it('keeps every file when uploads settle together', async () => {
		storeFileMock
			.mockResolvedValueOnce([
				stored(1),
			])
			.mockResolvedValueOnce([
				stored(2),
			]);
		const wrapper = mountField();

		await pickFiles(wrapper, [
			'a.txt',
			'b.txt',
		]);
		await flushPromises();
		vi.advanceTimersByTime(1600);

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([
			[
				stored(1),
				stored(2),
			],
		]);
	});

	it('keeps a failed upload on screen instead of adding it', async () => {
		storeFileMock.mockRejectedValue(new Error('413'));
		const wrapper = mountField();

		await pickFiles(wrapper, [
			'huge.bin',
		]);
		await flushPromises();
		vi.advanceTimersByTime(1600);

		expect(wrapper.emitted('update:modelValue')).toBeUndefined();
		expect(wrapper.text()).toContain('huge.bin');
	});

	it('removes a file after confirmation', async () => {
		const wrapper = mountField({
			modelValue: [
				stored(1),
				stored(2),
			],
		});

		await wrapper.findAll('[data-icon="bucket"]')[0].trigger('click');
		await wrapper.find('.confirm').trigger('click');

		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
			[
				stored(2),
			],
		]);
	});

	it('hides a read-only field with no files, and shows download instead of attach', () => {
		expect(
			mountField({
				readonly: true,
			})
				.find('.processing-form-file')
				.exists(),
		).toBe(false);

		const wrapper = mountField({
			readonly: true,
			modelValue: [
				stored(1),
			],
		});
		expect(wrapper.find('[data-icon="download"]').exists()).toBe(true);
		expect(wrapper.find('[data-icon="attach"]').exists()).toBe(false);
	});
});
