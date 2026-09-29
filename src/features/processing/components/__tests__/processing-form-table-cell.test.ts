import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ProcessingFormTableCell from '../fields/form-table/processing-form-table-cell.vue';

const mountCell = (value: unknown, type = 'text') =>
	mount(ProcessingFormTableCell, {
		props: {
			value,
			type,
		},
		global: {
			stubs: {
				'wt-icon': {
					props: [
						'icon',
						'color',
					],
					template: '<i class="icon" :data-icon="icon" :data-color="color" />',
				},
			},
		},
	});

describe('processing-form-table-cell', () => {
	it('joins list values and keeps 0, marking only empties with a dash', () => {
		expect(
			mountCell([
				'a',
				'b',
			]).text(),
		).toBe('a, b');
		expect(mountCell(0, 'number').text()).toBe('0');
		expect(mountCell('').text()).toBe('-');
		expect(mountCell([]).text()).toBe('-');
	});

	it('always draws booleans, false included', () => {
		const icon = mountCell(false, 'bool').find('.icon');

		expect(icon.attributes('data-icon')).toBe('false-ic');
		expect(icon.attributes('data-color')).toBe('error');
	});

	it('links http(s), mailto and tel, and leaves anything else as text', () => {
		const wrapper = mountCell(
			[
				'https://example.com/a',
				'mailto:jane@example.com',
				'javascript:alert(1)',
				'data:text/html,<b>x</b>',
			],
			'link',
		);

		expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toEqual(
			[
				'https://example.com/a',
				'mailto:jane@example.com',
			],
		);
		expect(wrapper.text()).toContain('javascript:alert(1)');
	});

	it('formats datetimes', () => {
		expect(mountCell(Date.UTC(2026, 0, 2, 3, 4), 'datetime').text()).not.toBe(
			'-',
		);
	});
});
