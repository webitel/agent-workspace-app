import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@webitel/ui-sdk/components', () => ({
	WtTable: {
		name: 'WtTable',
		props: {
			data: Array,
			dataKey: String,
		},
		template: `<table>
			<tr v-for="row in data" :key="row[dataKey]" class="row">
				<td class="row-key">{{ row.key }}</td>
				<td class="row-value">{{ row.value }}</td>
			</tr>
			<slot v-if="!data.length" name="empty" />
		</table>`,
	},
}));

import CallsHistoryInfoVariables from '../calls-history-info-variables.vue';

const stubs = {
	'wt-empty': {
		props: [
			'text',
		],
		template: '<div class="empty">{{ text }}</div>',
	},
};

const mountTab = (variables?: Record<string, string>) =>
	mount(CallsHistoryInfoVariables, {
		props: {
			variables,
		},
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
			stubs,
		},
	});

describe('calls-history-info-variables', () => {
	it('shows each variable as a key-value row', () => {
		const wrapper = mountTab({
			lang: 'uk',
			source: 'web',
		});

		const rows = wrapper.findAll('.row');

		expect(
			rows.map((row) => [
				row.find('.row-key').text(),
				row.find('.row-value').text(),
			]),
		).toEqual([
			[
				'lang',
				'uk',
			],
			[
				'source',
				'web',
			],
		]);
		expect(wrapper.find('.empty').exists()).toBe(false);
	});

	it.each([
		[
			'no variables',
			undefined,
		],
		[
			'an empty variables object',
			{},
		],
	])('shows the empty state for %s', (_, variables) => {
		const wrapper = mountTab(variables);

		expect(wrapper.findAll('.row')).toHaveLength(0);
		expect(wrapper.find('.empty').text()).toBe('ui.reusable.nothingToShowHere');
	});
});
