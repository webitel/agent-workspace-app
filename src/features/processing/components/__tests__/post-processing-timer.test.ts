import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

vi.mock('vue-i18n', () => ({
	useI18n: () => ({
		t: (
			key: string,
			params?: {
				count?: number;
			},
		) => (params ? `${key}:${params.count}` : key),
	}),
}));

import { PROCESSING_TOTAL_SEC_STUB } from '../../store/processing';
import PostProcessingTimer from '../post-processing-timer.vue';

const NOW = 1_000_000;
const TOTAL_MS = PROCESSING_TOTAL_SEC_STUB * 1000;
let nextId = 1;

function makeTask(overrides = {}) {
	return reactive({
		id: nextId++,
		state: 'processing',
		hasForm: false,
		form: null,
		processingTimeoutAt: NOW + TOTAL_MS,
		renewalSec: 10,
		_processing: {
			processing_prolongation: {
				remaining_prolongations: 2,
				prolongation_sec: 30,
			},
		},
		renew: vi.fn(() => Promise.resolve({})),
		...overrides,
	});
}

const mountTimer = (task: ReturnType<typeof makeTask>) =>
	mount(PostProcessingTimer, {
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
				'wt-tooltip': {
					template: '<div><slot name="activator" /><slot /></div>',
				},
				'wt-icon-btn': {
					props: [
						'disabled',
					],
					template: '<button class="renew" :disabled="disabled" />',
				},
			},
		},
	});

describe('post-processing-timer', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('counts down without an hours segment', () => {
		const wrapper = mountTimer(
			makeTask({
				processingTimeoutAt: NOW + 59_000,
			}),
		);

		expect(wrapper.text()).toContain('00:59');
	});

	it('turns from green to orange to red as it runs down', async () => {
		const wrapper = mountTimer(makeTask());
		const time = () => wrapper.find('.post-processing-timer__time');

		expect(time().classes()).toContain('post-processing-timer__time--success');

		// half of the phase gone: orange
		vi.setSystemTime(NOW + TOTAL_MS / 2);
		await vi.advanceTimersByTimeAsync(1_000);
		expect(time().classes()).toContain('post-processing-timer__time--warning');

		// five sixths gone: red
		vi.setSystemTime(NOW + (TOTAL_MS * 5) / 6);
		await vi.advanceTimersByTimeAsync(1_000);
		expect(time().classes()).toContain('post-processing-timer__time--error');
	});

	it('opens renewal only in the queue’s renewal window, with the extensions left in the tooltip', async () => {
		const task = makeTask();
		const wrapper = mountTimer(task);
		const renew = () => wrapper.find('.renew');

		expect(renew().attributes('disabled')).toBeDefined();
		expect(wrapper.text()).toContain(
			'ui.processing.postProcessing.extensionsLeft:2',
		);

		// inside the queue's 10s renewal window
		vi.setSystemTime(NOW + TOTAL_MS - 5_000);
		await vi.advanceTimersByTimeAsync(1_000);
		expect(renew().attributes('disabled')).toBeUndefined();

		await renew().trigger('click');
		expect(task.renew).toHaveBeenCalledWith(30);
	});

	it('does not renew once the queue has no extensions left', async () => {
		const wrapper = mountTimer(
			makeTask({
				processingTimeoutAt: NOW + 5_000,
				_processing: {
					processing_prolongation: {
						remaining_prolongations: 0,
					},
				},
			}),
		);

		expect(wrapper.find('.renew').attributes('disabled')).toBeDefined();
	});
});
