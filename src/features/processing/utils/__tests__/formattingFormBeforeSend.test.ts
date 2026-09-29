import { describe, expect, it } from 'vitest';

import { formattingFormBeforeSend } from '../formattingFormBeforeSend';

describe('formattingFormBeforeSend', () => {
	it('sends a case status as its id whether seeded or picked', () => {
		expect(
			formattingFormBeforeSend([
				{
					id: 'seeded',
					value: {
						id: 3,
						name: 'Resolved',
					},
					view: {
						component: 'form-select-case-status',
					},
				},
				{
					id: 'picked',
					value: 2,
					view: {
						component: 'form-select-case-status',
					},
				},
			]),
		).toEqual({
			seeded: 3,
			picked: 2,
		});
	});

	it('sends a service as its id whether seeded or picked', () => {
		expect(
			formattingFormBeforeSend([
				{
					id: 'seeded',
					value: {
						id: 100,
						name: 'Card refund',
					},
					view: {
						component: 'form-select-service',
					},
				},
				{
					id: 'picked',
					value: 10,
					view: {
						component: 'form-select-service',
					},
				},
			]),
		).toEqual({
			seeded: 100,
			picked: 10,
		});
	});

	it('passes a record picked from an object through untouched', () => {
		const city = {
			id: 7,
			name: 'Kyiv',
		};

		expect(
			formattingFormBeforeSend([
				{
					id: 'city',
					value: city,
					view: {
						component: 'form-select-from-object',
					},
				},
			]),
		).toEqual({
			city,
		});
	});

	it('drops display-only form-text', () => {
		expect(
			formattingFormBeforeSend([
				{
					id: 'intro',
					value: 'read me',
					view: {
						component: 'form-text',
					},
				},
			]),
		).toEqual({});
	});
});
