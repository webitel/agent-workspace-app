import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockEmit as emitMock } from '../../../../../test/setup';

const getFormTableRowsMock = vi.fn();

vi.mock('../../api/formTableRows', () => ({
	getFormTableRows: (...args: unknown[]) => getFormTableRowsMock(...args),
}));

import ProcessingFormTable from '../fields/form-table/processing-form-table.vue';

// Renders every row through the header slots, and exposes the observer.
const stubs = {
	'wt-icon': true,
	'wt-expansion-panel': {
		template: '<section><slot name="title" /><slot /></section>',
	},
	'wt-button': {
		template:
			'<button class="row-action" @click="$emit(\'click\')"><slot /></button>',
	},
	'wt-intersection-observer': {
		name: 'Observer',
		props: [
			'canLoadMore',
			'loading',
		],
		emits: [
			'next',
		],
		template: '<div class="observer" />',
	},
	'wt-table': {
		props: [
			'data',
			'headers',
		],
		template: `<table>
			<tr v-for="(item, index) in data" :key="index" class="row">
				<td v-for="header in headers" :key="header.value" :class="header.value">
					<slot :name="header.value" :item="item" />
				</td>
			</tr>
		</table>`,
	},
};

const columns = [
	{
		field: 'name',
		name: 'Name',
		type: 'text',
	},
	{
		field: 'emails.data.number',
		name: 'Emails',
		type: 'text',
	},
];

const mountTable = (props: Record<string, unknown>) =>
	mount(ProcessingFormTable, {
		props: {
			componentId: 'orders',
			...props,
		} as never,
		global: {
			stubs,
		},
	});

describe('processing-form-table', () => {
	beforeEach(() => {
		getFormTableRowsMock.mockReset();
		emitMock.mockClear();
	});

	it('flattens an inline source into one value per column', async () => {
		const wrapper = mountTable({
			table: {
				displayColumns: columns,
				source: [
					{
						name: 'Jane',
						emails: {
							data: [
								{
									number: 'a@x.io',
								},
								{
									number: 'b@x.io',
								},
							],
						},
					},
				],
			},
		});
		await flushPromises();

		expect(wrapper.find('.name').text()).toBe('Jane');
		expect(wrapper.find('.emails_data_number').text()).toBe('a@x.io, b@x.io');
		expect(getFormTableRowsMock).not.toHaveBeenCalled();
	});

	it('pages a system source with the schema filters and the columns it needs', async () => {
		getFormTableRowsMock
			.mockResolvedValueOnce({
				items: [
					{
						commonName: 'Jane',
					},
				],
				next: true,
			})
			.mockResolvedValueOnce({
				items: [
					{
						commonName: 'John',
					},
				],
				next: false,
			});
		const wrapper = mountTable({
			table: {
				displayColumns: [
					{
						field: 'common_name',
						name: 'Name',
						type: 'text',
					},
				],
				isSystemSource: true,
				systemSource: {
					path: '/contacts',
				},
			},
			filters: [
				'group=vip',
			],
			fields: [
				'id',
			],
		});
		await flushPromises();

		expect(getFormTableRowsMock).toHaveBeenCalledWith({
			path: '/contacts',
			filters: [
				'group=vip',
			],
			fields: [
				'id',
				'common_name',
			],
			page: 1,
		});

		await wrapper
			.findComponent({
				name: 'Observer',
			})
			.vm.$emit('next');
		await flushPromises();

		expect(getFormTableRowsMock.mock.calls[1][0].page).toBe(2);
		expect(wrapper.findAll('.row').map((row) => row.text())).toEqual([
			'Jane',
			'John',
		]);
	});

	it('toasts when a system source fails to load', async () => {
		getFormTableRowsMock.mockRejectedValue(new Error('500'));
		mountTable({
			table: {
				displayColumns: columns,
				isSystemSource: true,
				systemSource: {
					path: '/contacts',
				},
			},
		});
		await flushPromises();

		expect(emitMock).toHaveBeenCalledWith('notification', {
			type: 'error',
			text: 'Could not load the table',
		});
	});

	it('puts an action button in its column and emits the row with it', async () => {
		const wrapper = mountTable({
			table: {
				displayColumns: columns,
				source: [
					{
						id: 7,
						name: 'Jane',
					},
				],
			},
			actions: [
				{
					field: 'name',
					action: 'pick',
					buttonName: 'Pick',
				},
			],
		});
		await flushPromises();

		await wrapper.find('.row-action').trigger('click');

		expect(wrapper.emitted('table-action')?.[0]).toEqual([
			{
				componentId: 'orders',
				action: 'pick',
				row: expect.objectContaining({
					id: 7,
					name: 'Jane',
				}),
			},
		]);
	});
});
