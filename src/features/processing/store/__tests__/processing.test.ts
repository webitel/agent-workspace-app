import { createTestingPinia } from '@pinia/testing';
import { getActivePinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive, ref } from 'vue';
import type { Task } from 'webitel-sdk';

import { mockEmit as emitMock } from '../../../../../test/setup';
import type { ProcessingFormData } from '../../types/ProcessingForm.types';
import { toNaiveUtcTimestamp } from '../../utils/naiveUtcTimestamp';
import {
	disposeProcessing,
	useProcessingStore,
	watchProcessingDisposal,
} from '../processing';

// the SDK task feed, every channel
const feed = ref<
	{
		id: number;
		channel: string;
	}[]
>([]);

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		tasks: feed,
	}),
}));

let nextId = 1;

// reactive, like the SDK's own tasks, so the store's getters track it
function makeTask(form: ProcessingFormData | null, overrides = {}) {
	return reactive({
		id: nextId++,
		hasForm: true,
		state: 'bridged',
		form,
		processingTimeoutAt: null,
		renewalSec: null,
		totalProcessingSec: null,
		_processing: null,
		formAction: vi.fn(() => Promise.resolve({})),
		renew: vi.fn(() => Promise.resolve({})),
		componentAction: vi.fn(() => Promise.resolve({})),
		...overrides,
	});
}

const store = (task: ReturnType<typeof makeTask>) =>
	useProcessingStore(task as unknown as Task);

const inputForm = (value: unknown = ''): ProcessingFormData => ({
	metadata: {
		isInited: true,
	},
	actions: [
		{
			id: 'complete',
			view: {
				text: 'Complete',
			},
		},
	],
	body: [
		{
			id: 'note',
			value,
			view: {
				component: 'wt-input',
			},
		},
	],
});

describe('processing store', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
				createSpy: vi.fn,
			}),
		);
		emitMock.mockClear();
	});

	it('exposes title, body and actions from the task form', () => {
		const task = makeTask({
			...inputForm('hi'),
			title: 'Wrap up',
		});

		const processing = store(task);

		expect(processing.hasForm).toBe(true);
		expect(processing.formTitle).toBe('Wrap up');
		expect(processing.formBody).toHaveLength(1);
		expect(processing.formActions[0].id).toBe('complete');
	});

	it('has no form while the task carries none', () => {
		expect(store(makeTask(null)).hasForm).toBe(false);
	});

	it('initialize() seeds defaults, syncs fields and marks the form inited', () => {
		const task = makeTask({
			metadata: {},
			actions: [],
			body: [
				{
					id: 'reason',
					value: '',
					view: {
						component: 'wt-select',
						initialValue: 'b',
						options: [
							{
								value: 'a',
								name: 'A',
							},
							{
								value: 'b',
								name: 'B',
							},
						],
					},
				},
			],
		});

		store(task).initialize();

		expect(task.form?.body[0].value).toEqual({
			value: 'b',
			name: 'B',
		});
		expect(task.form?.metadata.isInited).toBe(true);
		expect(task.form?.fields).toEqual({
			reason: 'b',
		});
	});

	it('initialize() is a no-op once the form is inited', () => {
		const task = makeTask({
			...inputForm(),
			body: [
				{
					id: 'note',
					value: '',
					view: {
						component: 'wt-input',
						initialValue: 'seed',
					},
				},
			],
		});

		store(task).initialize();

		expect(task.form?.body[0].value).toBe('');
	});

	it('change() writes the value onto the SDK form and refreshes its fields', () => {
		const task = makeTask(inputForm());
		const processing = store(task);

		processing.change(processing.formBody[0], 'typed');

		expect(task.form?.body[0].value).toBe('typed');
		expect(task.form?.fields).toEqual({
			note: 'typed',
		});
	});

	it('submits the formatted body, never stale backend fields', async () => {
		const isoDate = '2026-07-14T10:00:00.000Z';
		const task = makeTask({
			metadata: {
				isInited: true,
			},
			actions: [],
			// what a backend-sent `fields` would look like — must not win
			fields: {
				reason: 'stale',
			},
			body: [
				{
					id: 'reason',
					value: {
						value: 'resolved',
						name: 'Resolved',
					},
					view: {
						component: 'wt-select',
					},
				},
				{
					id: 'when',
					value: isoDate,
					view: {
						component: 'wt-datetimepicker',
					},
				},
				{
					id: 'intro',
					value: 'read me',
					view: {
						component: 'form-text',
					},
				},
			],
		});

		await store(task).submit({
			id: 'complete',
			view: {},
		});

		expect(task.formAction).toHaveBeenCalledWith('complete', {
			reason: 'resolved',
			when: toNaiveUtcTimestamp(isoDate),
		});
	});

	it('locks every action while one is in flight', async () => {
		let resolveAction: (value: object) => void = () => {};
		const task = makeTask(inputForm('done'), {
			formAction: vi.fn(
				() =>
					new Promise<object>((resolve) => {
						resolveAction = resolve;
					}),
			),
		});
		const processing = store(task);

		const pending = processing.submit({
			id: 'complete',
			view: {},
		});
		expect(processing.submittingActionId).toBe('complete');
		expect(processing.isSubmitting).toBe(true);

		await processing.submit({
			id: 'callback',
			view: {},
		});
		expect(task.formAction).toHaveBeenCalledTimes(1);

		resolveAction({});
		await pending;
		expect(processing.isSubmitting).toBe(false);
	});

	it('keeps the form and raises an error toast when submitting fails', async () => {
		const task = makeTask(inputForm('done'), {
			formAction: vi.fn(() => Promise.reject(new Error('rejected'))),
		});
		const processing = store(task);

		await processing.submit({
			id: 'complete',
			view: {},
		});

		expect(processing.error).toBeInstanceOf(Error);
		expect(processing.isSubmitting).toBe(false);
		expect(task.form?.body[0].value).toBe('done');
		expect(emitMock).toHaveBeenCalledWith('notification', {
			type: 'error',
			text: 'rejected',
		});
	});

	it('reports post-processing and the renewals left', () => {
		const task = makeTask(inputForm(), {
			state: 'processing',
			processingTimeoutAt: 1_000,
			renewalSec: 10,
			_processing: {
				processing_prolongation: {
					remaining_prolongations: 2,
					prolongation_sec: 30,
				},
			},
		});

		const processing = store(task);

		expect(processing.isPostProcessing).toBe(true);
		expect(processing.processingTimeoutAt).toBe(1_000);
		expect(processing.renewalSec).toBe(10);
		expect(processing.remainingProlongations).toBe(2);
	});

	it('reports the SDK’s total post-processing length, renewals included', () => {
		const task = makeTask(inputForm(), {
			totalProcessingSec: 90,
		});

		expect(store(task).processingTotalSec).toBe(90);

		task.totalProcessingSec = 120;

		expect(store(task).processingTotalSec).toBe(120);
	});

	it('has no total before post-processing starts', () => {
		expect(store(makeTask(inputForm())).processingTotalSec).toBeNull();
	});

	it('renews by the queue prolongation, or lets the SDK default it', async () => {
		const withProlongation = makeTask(inputForm(), {
			_processing: {
				processing_prolongation: {
					prolongation_sec: 30,
				},
			},
		});
		const withoutProlongation = makeTask(inputForm());

		await store(withProlongation).renew();
		await store(withoutProlongation).renew();

		expect(withProlongation.renew).toHaveBeenCalledWith(30);
		expect(withoutProlongation.renew).toHaveBeenCalledWith(undefined);
	});

	it('runs a table row action with the row as its variable', async () => {
		const task = makeTask(inputForm());
		const row = {
			id: 7,
		};

		await store(task).tableAction({
			componentId: 'orders',
			action: 'pick',
			row,
		});

		expect(task.componentAction).toHaveBeenCalledWith('orders', 'pick', {
			pick: row,
		});
	});

	it('toasts when a table row action fails', async () => {
		const task = makeTask(inputForm(), {
			componentAction: vi.fn(() => Promise.reject(new Error('denied'))),
		});

		await store(task).tableAction({
			componentId: 'orders',
			action: 'pick',
			row: {},
		});

		expect(emitMock).toHaveBeenCalledWith('notification', {
			type: 'error',
			text: 'denied',
		});
	});

	it('keeps one store per attempt and drops it on dispose', () => {
		const task = makeTask(inputForm());
		const processing = store(task);

		expect(store(task)).toBe(processing);

		disposeProcessing(task.id);

		expect(getActivePinia()?.state.value[`processing:${task.id}`]).toBe(
			undefined,
		);
		expect(store(task)).not.toBe(processing);
	});

	describe('disposal', () => {
		it("disposes an attempt's store once its task leaves the feed, whatever the channel", async () => {
			const chat = makeTask(inputForm());
			const call = makeTask(inputForm());
			const chatProcessing = store(chat);
			const callProcessing = store(call);
			const stop = watchProcessingDisposal();

			feed.value = [
				{
					id: chat.id,
					channel: 'chat',
				},
				{
					id: call.id,
					channel: 'call',
				},
			];
			await nextTick();
			expect(store(chat)).toBe(chatProcessing);
			expect(store(call)).toBe(callProcessing);

			feed.value = [];
			await nextTick();

			expect(store(chat)).not.toBe(chatProcessing);
			expect(store(call)).not.toBe(callProcessing);
			stop();
		});

		it('leaves the stores of tasks still in the feed alone', async () => {
			const leaving = makeTask(inputForm());
			const staying = makeTask(inputForm());
			const leavingProcessing = store(leaving);
			const stayingProcessing = store(staying);
			const stop = watchProcessingDisposal();

			feed.value = [
				{
					id: leaving.id,
					channel: 'chat',
				},
				{
					id: staying.id,
					channel: 'call',
				},
			];
			await nextTick();
			feed.value = [
				{
					id: staying.id,
					channel: 'call',
				},
			];
			await nextTick();

			expect(store(leaving)).not.toBe(leavingProcessing);
			expect(store(staying)).toBe(stayingProcessing);
			stop();
		});
	});
});
