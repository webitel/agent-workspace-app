import { describe, expect, it } from 'vitest';

import { readColumnValue, toPathSteps, toSlotKey } from '../formTableValues';

describe('form table values', () => {
	it('splits dot and bracket paths into steps', () => {
		expect(toPathSteps('contact.emails[11].update_by.name')).toEqual([
			'contact',
			'emails',
			'11',
			'update_by',
			'name',
		]);
		expect(toPathSteps('name')).toEqual([
			'name',
		]);
	});

	it('turns every separator into a slot-safe underscore', () => {
		expect(toSlotKey('contact.emails[11].name')).toBe(
			'contact_emails_11__name',
		);
		expect(toSlotKey('a.b.c')).toBe('a_b_c');
	});

	it('reads a direct path, keeping 0 as a value', () => {
		expect(
			readColumnValue(
				{
					data: {
						name: 'Jane',
					},
				},
				[
					'data',
					'name',
				],
			),
		).toBe('Jane');
		expect(readColumnValue(0, [])).toBe(0);
		expect(
			readColumnValue(undefined, [
				'x',
			]),
		).toBeUndefined();
	});

	it('fans out over arrays along the path', () => {
		expect(
			readColumnValue(
				{
					data: [
						{
							type: {
								name: 'Work',
							},
						},
						{
							type: {
								name: 'Home',
							},
						},
						{},
					],
				},
				[
					'data',
					'type',
					'name',
				],
			),
		).toEqual([
			'Work',
			'Home',
		]);
	});
});
