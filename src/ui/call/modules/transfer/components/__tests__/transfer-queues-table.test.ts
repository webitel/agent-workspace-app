import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

const getQueuesListMock = vi.fn();

vi.mock('@webitel/api-services/api', () => ({
	QueuesAPI: {
		getList: (...args: unknown[]) => getQueuesListMock(...args),
	},
}));

import { useTransferQueuesDataListStore } from '../../store/transferQueuesDataList';
import TransferQueuesTable from '../transfer-queues-table.vue';

const WtTableStub = defineComponent({
	name: 'WtTableStub',
	props: [
		'data',
		'activeRow',
	],
	emits: [
		'row-click',
	],
	setup: () => () => h('div'),
});

function mountTable({
	search = '',
	selectedRowId = null,
}: {
	search?: string;
	selectedRowId?: string | null;
} = {}) {
	const wrapper = mount(TransferQueuesTable, {
		props: {
			search,
			selectedRowId,
			'onUpdate:selectedRowId': (id: string | null) =>
				wrapper.setProps({
					selectedRowId: id,
				}),
		},
		global: {
			stubs: {
				'wt-table': WtTableStub,
			},
		},
	});
	return wrapper;
}

describe('TransferQueuesTable', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		getQueuesListMock.mockReset();
		getQueuesListMock.mockResolvedValue({
			items: [
				{
					id: '1',
					name: 'Sales',
				},
			],
			next: false,
		});
	});

	it('loads the first page once, with the search', async () => {
		mountTable({
			search: 'sa',
		});
		await flushPromises();

		expect(getQueuesListMock).toHaveBeenCalledTimes(1);
		expect(getQueuesListMock).toHaveBeenCalledWith(
			expect.objectContaining({
				search: 'sa',
				page: 1,
			}),
		);
	});

	it('clears the rows on unmount without loading the list again (ADR-0029)', async () => {
		const wrapper = mountTable();
		await flushPromises();

		wrapper.unmount();
		await flushPromises();

		expect(useTransferQueuesDataListStore().dataList).toEqual([]);
		expect(getQueuesListMock).toHaveBeenCalledTimes(1);
	});

	it('clears the selection on a second click on the selected row', async () => {
		const wrapper = mountTable();
		await flushPromises();
		const table = wrapper.findComponent(WtTableStub);
		const row = table.props('data')[0];

		table.vm.$emit('row-click', {
			data: row,
		});
		await flushPromises();
		expect(wrapper.props('selectedRowId')).toBe('1');

		table.vm.$emit('row-click', {
			data: row,
		});
		await flushPromises();
		expect(wrapper.props('selectedRowId')).toBeNull();
	});
});
