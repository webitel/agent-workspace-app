import { describe, expect, it, vi } from 'vitest';
import type { Task } from 'webitel-sdk';

import type { ProcessingFormData } from '../../types/ProcessingForm.types';
import { toNaiveUtcTimestamp } from '../../utils/naiveUtcTimestamp';
import { useProcessingForm } from '../useProcessingForm';

interface FakeTask {
	attempt: FakeTask;
	hasForm: boolean;
	form: ProcessingFormData;
	formAction: ReturnType<typeof vi.fn>;
}

function makeTask(form: ProcessingFormData): FakeTask {
	const task = {
		hasForm: true,
		form,
		formAction: vi.fn(() => Promise.resolve({})),
	} as unknown as FakeTask;
	Object.defineProperty(task, 'attempt', {
		get() {
			return task;
		},
	});
	return task;
}

function asTaskRef(task: FakeTask): () => Task {
	return () => task as unknown as Task;
}

describe('useProcessingForm', () => {
	it('exposes title, body and actions from the task form', () => {
		const task = makeTask({
			title: 'Wrap up',
			metadata: {
				isInited: true,
			},
			actions: [
				{
					id: 'save',
					view: {
						text: 'Save',
					},
				},
			],
			body: [
				{
					id: 'note',
					value: 'hi',
					view: {
						component: 'wt-input',
					},
				},
			],
		});

		const { formTitle, formBody, formActions, hasForm } = useProcessingForm(
			asTaskRef(task),
		);

		expect(formTitle.value).toBe('Wrap up');
		expect(hasForm.value).toBe(true);
		expect(formBody.value).toHaveLength(1);
		expect(formActions.value[0].id).toBe('save');
	});

	it('initializes a select value by matching its option and marks the form inited', () => {
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

		useProcessingForm(asTaskRef(task));

		expect(task.form.body[0].value).toEqual({
			value: 'b',
			name: 'B',
		});
		expect(task.form.metadata.isInited).toBe(true);
	});

	it('resolves a "now" datetimepicker initial value to a numeric timestamp', () => {
		const task = makeTask({
			metadata: {},
			actions: [],
			body: [
				{
					id: 'when',
					value: '',
					view: {
						component: 'wt-datetimepicker',
						initialValue: 'now',
					},
				},
			],
		});

		useProcessingForm(asTaskRef(task));

		expect(typeof task.form.body[0].value).toBe('number');
	});

	it('JSON-parses a plain field initial value', () => {
		const task = makeTask({
			metadata: {},
			actions: [],
			body: [
				{
					id: 'count',
					value: '',
					view: {
						component: 'form-text',
						initialValue: '42',
					},
				},
			],
		});

		useProcessingForm(asTaskRef(task));

		expect(task.form.body[0].value).toBe(42);
	});

	it('does not re-initialize when a value is already present', () => {
		const task = makeTask({
			metadata: {},
			actions: [],
			body: [
				{
					id: 'note',
					value: 'kept',
					view: {
						component: 'wt-input',
						initialValue: 'ignored',
					},
				},
			],
		});

		useProcessingForm(asTaskRef(task));

		expect(task.form.body[0].value).toBe('kept');
	});

	it('submits the formatted body: unwraps select, converts datetime', () => {
		const isoDate = '2026-07-14T10:00:00.000Z';
		const task = makeTask({
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
					id: 'note',
					value: 'done',
					view: {
						component: 'wt-input',
					},
				},
			],
		});

		const { submit } = useProcessingForm(asTaskRef(task));
		submit({
			id: 'complete',
			view: {},
		});

		expect(task.formAction).toHaveBeenCalledWith('complete', {
			reason: 'resolved',
			when: toNaiveUtcTimestamp(isoDate),
			note: 'done',
		});
	});

	it('change() writes the value onto the body element in place', () => {
		const task = makeTask({
			metadata: {
				isInited: true,
			},
			actions: [],
			body: [
				{
					id: 'note',
					value: '',
					view: {
						component: 'wt-input',
					},
				},
			],
		});

		const { formBody, change } = useProcessingForm(asTaskRef(task));
		change(formBody.value[0], 'typed');

		expect(task.form.body[0].value).toBe('typed');
	});
});
