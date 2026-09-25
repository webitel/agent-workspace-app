import { describe, expect, it } from 'vitest';

import type { ProcessingFormData } from '../../types/ProcessingForm.types';
import { initFormValues } from '../initFormValues';

function makeForm(body: ProcessingFormData['body']): ProcessingFormData {
	return {
		metadata: {},
		actions: [],
		body,
	};
}

describe('initFormValues', () => {
	it('matches a select initialValue against its option object', () => {
		const form = makeForm([
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
		]);

		initFormValues(form);

		expect(form.body[0].value).toEqual({
			value: 'b',
			name: 'B',
		});
	});

	it('seeds a case status with the option its id names, or nothing', () => {
		const options = [
			{
				id: 3,
				name: 'Resolved',
				final: true,
			},
		];
		const form = makeForm([
			{
				id: 'status',
				value: '',
				view: {
					component: 'form-select-case-status',
					initialValue: '3',
					options: options as never,
				},
			},
			{
				id: 'unknownStatus',
				value: '',
				view: {
					component: 'form-select-case-status',
					initialValue: '99',
					options: options as never,
				},
			},
		]);

		initFormValues(form);

		expect(form.body[0].value).toEqual(options[0]);
		expect(form.body[1].value).toBeUndefined();
	});

	it('resolves a "now" datetimepicker initialValue to a numeric timestamp', () => {
		const form = makeForm([
			{
				id: 'when',
				value: '',
				view: {
					component: 'wt-datetimepicker',
					initialValue: 'now',
				},
			},
		]);

		initFormValues(form);

		expect(typeof form.body[0].value).toBe('number');
	});

	it('JSON-parses a plain field initialValue', () => {
		const form = makeForm([
			{
				id: 'count',
				value: '',
				view: {
					component: 'form-text',
					initialValue: '42',
				},
			},
		]);

		initFormValues(form);

		expect(form.body[0].value).toBe(42);
	});

	it('leaves a field that already has a value untouched', () => {
		const form = makeForm([
			{
				id: 'note',
				value: 'kept',
				view: {
					component: 'wt-input',
					initialValue: 'ignored',
				},
			},
		]);

		initFormValues(form);

		expect(form.body[0].value).toBe('kept');
	});

	it('resets metadata and marks the form initialized', () => {
		const form = makeForm([]);
		form.metadata = {
			stale: true,
		};

		initFormValues(form);

		expect(form.metadata.stale).toBeUndefined();
		expect(form.metadata.isInited).toBe(true);
	});
});
