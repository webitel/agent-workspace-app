import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { CallInfoPanelField } from '../../../types/CallInfoPanelField.types';
import CallInfoPanelFields from '../call-info-panel-fields.vue';

const mountFields = (fields: CallInfoPanelField[]) =>
	mount(CallInfoPanelFields, {
		props: {
			fields,
		},
	});

const shownTexts = (wrapper: ReturnType<typeof mountFields>) =>
	wrapper
		.findAll('.call-info-panel-fields__field')
		.map((field) => `${field.find('dt').text()} ${field.find('dd').text()}`);

describe('call-info-panel-fields', () => {
	it('shows each field as label and value, in the given order', () => {
		const wrapper = mountFields([
			{
				label: 'From',
				value: '+12023417842',
			},
			{
				label: 'To',
				value: '1001',
			},
		]);

		expect(shownTexts(wrapper)).toEqual([
			'From: +12023417842',
			'To: 1001',
		]);
	});

	it('leaves out a field without a value', () => {
		const wrapper = mountFields([
			{
				label: 'From',
				value: '+12023417842',
			},
			{
				label: 'Queue',
				value: undefined,
			},
		]);

		expect(shownTexts(wrapper)).toEqual([
			'From: +12023417842',
		]);
	});
});
