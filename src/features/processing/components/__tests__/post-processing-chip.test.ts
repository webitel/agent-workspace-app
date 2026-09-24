import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

import PostProcessingChip from '../post-processing-chip.vue';

const NOW = 1_000_000;
let nextId = 1;

function makeTask(overrides = {}) {
	return reactive({
		id: nextId++,
		hasForm: true,
		state: 'processing',
		form: null,
		processingTimeoutAt: NOW + 59_000,
		renewalSec: 10,
		_processing: {
			processing_prolongation: {
				remaining_prolongations: 1,
				prolongation_sec: 30,
			},
		},
		renew: vi.fn(() => Promise.resolve({})),
		...overrides,
	});
}

const mountChip = (task: ReturnType<typeof makeTask>) =>
	mount(PostProcessingChip, {
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
			stubs: {
				'wt-icon-btn': {
					props: [
						'disabled',
					],
					template: '<button class="renew" :disabled="disabled" />',
				},
			},
		},
	});

const renewButton = (wrapper: ReturnType<typeof mountChip>) =>
	wrapper.find('.renew');

describe('post-processing-chip', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('counts down to the processing deadline', async () => {
		const wrapper = mountChip(makeTask());
		expect(wrapper.text()).toContain('Post-processing');
		expect(wrapper.text()).toContain('00:59');

		vi.advanceTimersByTime(9_000);
		await nextTick();

		expect(wrapper.text()).toContain('00:50');
	});

	it('stays hidden outside post-processing', () => {
		const wrapper = mountChip(
			makeTask({
				state: 'bridged',
			}),
		);

		expect(wrapper.find('.post-processing-chip').exists()).toBe(false);
	});

	it('only allows renewing inside the renewal window', async () => {
		const task = makeTask();
		const wrapper = mountChip(task);
		expect(renewButton(wrapper).attributes('disabled')).toBeDefined();

		vi.advanceTimersByTime(50_000);
		await nextTick();
		expect(renewButton(wrapper).attributes('disabled')).toBeUndefined();

		await renewButton(wrapper).trigger('click');
		expect(task.renew).toHaveBeenCalledWith(30);
	});

	it('does not allow renewing once the prolongations run out', async () => {
		const wrapper = mountChip(
			makeTask({
				_processing: {
					processing_prolongation: {
						remaining_prolongations: 0,
					},
				},
			}),
		);

		vi.advanceTimersByTime(55_000);
		await nextTick();

		expect(renewButton(wrapper).attributes('disabled')).toBeDefined();
	});
});
