import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { SortSymbols } from '@webitel/ui-sdk/scripts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

// The real table pulls in PrimeVue; this one needs rows in, sort events out.
vi.mock('@webitel/ui-sdk/components', () => ({
	WtTable: {
		name: 'WtTable',
		props: {
			data: Array,
			headers: Array,
			dataKey: String,
			sortable: Boolean,
		},
		emits: [
			'sort',
		],
		template: `<table>
			<tr v-for="row in data" :key="row[dataKey]" class="row">
				<td class="row-key">{{ row.key }}</td>
				<td class="row-value">{{ row.value }}</td>
			</tr>
		</table>`,
	},
	WtLoader: {
		name: 'WtLoader',
		template: '<div class="loader" />',
	},
	WtEmpty: {
		name: 'WtEmpty',
		props: [
			'text',
			'image',
		],
		template: '<div class="empty" :data-image="image">{{ text }}</div>',
	},
	WtMessage: {
		name: 'WtMessage',
		template: '<div class="message"><slot /></div>',
	},
	WtButton: {
		name: 'WtButton',
		emits: [
			'click',
		],
		template:
			'<button class="retry" @click="$emit(\'click\')"><slot /></button>',
	},
}));

import { useAppearanceStore } from '../../../appearance/store/appearanceStore';
import type { VariableRow } from '../../types/Variables.types';
import VariablesTable from '../variables-table.vue';

const row = (key: string, value: string): VariableRow => ({
	id: `call:${key}`,
	key,
	value,
});

const mountTable = (props: Record<string, unknown> = {}) =>
	mount(VariablesTable, {
		props: {
			rows: [],
			...props,
		},
		global: {
			plugins: [
				createTestingPinia({
					stubActions: false,
					createSpy: vi.fn,
				}),
			],
		},
	});

const keysOf = (wrapper: ReturnType<typeof mountTable>) =>
	wrapper.findAll('.row-key').map((cell) => cell.text());

const tableOf = (wrapper: ReturnType<typeof mountTable>) =>
	wrapper.findComponent({
		name: 'WtTable',
	});

const headerSort = (wrapper: ReturnType<typeof mountTable>, field: string) =>
	(
		tableOf(wrapper).props('headers') as {
			field: string;
			sort: unknown;
		}[]
	).find((header) => header.field === field)?.sort;

describe('variables-table', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('shows the rows it is given, in that order', () => {
		const wrapper = mountTable({
			rows: [
				row('B', '2'),
				row('A', '1'),
			],
		});

		expect(keysOf(wrapper)).toEqual([
			'B',
			'A',
		]);
		expect(tableOf(wrapper).props('dataKey')).toBe('id');
	});

	describe('while waiting for the first answer', () => {
		it('shows a loader, not the empty state, when there is nothing to show yet', () => {
			const wrapper = mountTable({
				isPending: true,
			});

			expect(wrapper.find('.loader').exists()).toBe(true);
			expect(wrapper.find('.empty').exists()).toBe(false);
		});

		it('shows the rows it already has instead of a loader', () => {
			const wrapper = mountTable({
				isPending: true,
				rows: [
					row('A', '1'),
				],
			});

			expect(wrapper.find('.loader').exists()).toBe(false);
			expect(keysOf(wrapper)).toEqual([
				'A',
			]);
		});
	});

	describe('with no variables', () => {
		it('says so, with an illustration, and draws no table', () => {
			const wrapper = mountTable();

			const empty = wrapper.find('.empty');
			expect(empty.text()).toBe('ui.variables.empty');
			expect(empty.attributes('data-image')).toBeTruthy();
			expect(wrapper.find('table').exists()).toBe(false);
			expect(wrapper.find('.loader').exists()).toBe(false);
		});

		it('uses the dark illustration in the dark theme', async () => {
			const wrapper = mountTable();
			const light = wrapper.find('.empty').attributes('data-image');

			useAppearanceStore().setTheme('dark');
			await nextTick();

			const dark = wrapper.find('.empty').attributes('data-image');
			expect(dark).toBeTruthy();
			expect(dark).not.toBe(light);
		});
	});

	describe('when the last fetch failed', () => {
		it('keeps the rows and shows the error beside them', () => {
			const wrapper = mountTable({
				error: new Error('network down'),
				rows: [
					row('A', '1'),
				],
			});

			expect(wrapper.find('.message').text()).toContain(
				'ui.variables.loadError',
			);
			expect(keysOf(wrapper)).toEqual([
				'A',
			]);
		});

		it('asks the caller to retry', async () => {
			const wrapper = mountTable({
				error: new Error('network down'),
			});

			await wrapper.find('.retry').trigger('click');

			expect(wrapper.emitted('retry')).toHaveLength(1);
		});

		it('shows the error alone, without an empty state on top of it', () => {
			const wrapper = mountTable({
				error: new Error('network down'),
			});

			expect(wrapper.find('.message').exists()).toBe(true);
			expect(wrapper.find('.empty').exists()).toBe(false);
		});
	});

	describe('sorting', () => {
		const mountWithRows = () =>
			mountTable({
				rows: [
					row('B', '2'),
					row('A', '1'),
				],
			});

		it('turns table sorting on and starts unsorted, in the given order', () => {
			const wrapper = mountWithRows();

			expect(tableOf(wrapper).props('sortable')).toBe(true);
			expect(headerSort(wrapper, 'key')).toBe(SortSymbols.NONE);
			expect(keysOf(wrapper)).toEqual([
				'B',
				'A',
			]);
		});

		it('sorts by the column the table reports, and reflects it in that header', async () => {
			const wrapper = mountWithRows();

			tableOf(wrapper).vm.$emit(
				'sort',
				{
					field: 'key',
				},
				SortSymbols.ASC,
			);
			await nextTick();

			expect(keysOf(wrapper)).toEqual([
				'A',
				'B',
			]);
			expect(headerSort(wrapper, 'key')).toBe(SortSymbols.ASC);
			expect(headerSort(wrapper, 'value')).toBe(SortSymbols.NONE);
		});

		it('returns to the given order when the table reports no sort', async () => {
			const wrapper = mountWithRows();
			tableOf(wrapper).vm.$emit(
				'sort',
				{
					field: 'key',
				},
				SortSymbols.ASC,
			);
			await nextTick();

			tableOf(wrapper).vm.$emit(
				'sort',
				{
					field: 'key',
				},
				SortSymbols.NONE,
			);
			await nextTick();

			expect(keysOf(wrapper)).toEqual([
				'B',
				'A',
			]);
		});
	});
});
