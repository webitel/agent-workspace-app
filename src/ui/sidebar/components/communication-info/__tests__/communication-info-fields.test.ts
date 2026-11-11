import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CommunicationInfoFields from '../communication-info-fields.vue';
import type { CommunicationInfoField } from '../types/CommunicationInfoField.types';

const fields: CommunicationInfoField[] = [
	{
		key: 'from',
		label: 'From',
		value: '+12023417842',
	},
	{
		key: 'to',
		label: 'To',
		value: '1001',
	},
];

const mountFields = (
	shown: CommunicationInfoField[],
	slots: Record<string, string> = {},
) =>
	mount(CommunicationInfoFields, {
		props: {
			fields: shown,
		},
		slots,
	});

const shownTexts = (wrapper: ReturnType<typeof mountFields>) =>
	wrapper
		.findAll('.communication-info-fields__field')
		.map((field) => `${field.find('dt').text()} ${field.find('dd').text()}`);

describe('communication-info-fields', () => {
	it('shows each field as label and value, in the given order', () => {
		const wrapper = mountFields(fields);

		expect(shownTexts(wrapper)).toEqual([
			'From: +12023417842',
			'To: 1001',
		]);
	});

	it('leaves out a field without a value', () => {
		const wrapper = mountFields([
			...fields,
			{
				key: 'queue',
				label: 'Queue',
				value: undefined,
			},
		]);

		expect(shownTexts(wrapper)).toEqual([
			'From: +12023417842',
			'To: 1001',
		]);
	});

	it("replaces a field's value with its own slot, leaving the others as text", () => {
		const wrapper = mountFields(fields, {
			'value-from': '<b class="custom">{{ params.field.value }}</b>',
		});

		expect(wrapper.find('.custom').text()).toBe('+12023417842');
		expect(shownTexts(wrapper)).toEqual([
			'From: +12023417842',
			'To: 1001',
		]);
	});
});
