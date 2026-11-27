import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

const getAgentsListMock = vi.fn();

vi.mock('@webitel/api-services/api', () => ({
	AgentsAPI: {
		getList: (...args: unknown[]) => getAgentsListMock(...args),
	},
}));

vi.mock('../../../../../../features/userinfo/stores/userinfoStore', () => ({
	useUserinfoStore: () => ({
		userId: 'me',
	}),
}));

import { useTransferAgentsDataListStore } from '../../store/transferAgentsDataList';
import TransferAgentsTable from '../transfer-agents-table.vue';

const WtTableStub = defineComponent({
	name: 'WtTableStub',
	props: [
		'data',
		'activeRow',
		'onLoading',
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
	const wrapper = mount(TransferAgentsTable, {
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

describe('TransferAgentsTable', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		getAgentsListMock.mockReset();
		getAgentsListMock.mockResolvedValue({
			items: [
				{
					id: '1',
					name: 'John Doe',
				},
				{
					id: '2',
					name: 'Ann Lee',
				},
			],
			next: false,
		});
	});

	it('loads the first page once, with the search', async () => {
		mountTable({
			search: 'jo',
		});
		await flushPromises();

		expect(getAgentsListMock).toHaveBeenCalledTimes(1);
		expect(getAgentsListMock).toHaveBeenCalledWith(
			expect.objectContaining({
				search: 'jo',
				page: 1,
			}),
		);
	});

	it('reloads the list when the search changes', async () => {
		const wrapper = mountTable();
		await flushPromises();

		await wrapper.setProps({
			search: 'ann',
		});
		await flushPromises();

		expect(getAgentsListMock).toHaveBeenCalledTimes(2);
		expect(getAgentsListMock).toHaveBeenLastCalledWith(
			expect.objectContaining({
				search: 'ann',
				page: 1,
			}),
		);
	});

	it('loads the next page on scroll only while there is one', async () => {
		getAgentsListMock.mockResolvedValueOnce({
			items: [
				{
					id: '1',
					name: 'John Doe',
				},
			],
			next: true,
		});
		const wrapper = mountTable();
		await flushPromises();
		const onLoading = wrapper.findComponent(WtTableStub).props('onLoading');

		await onLoading();
		await flushPromises();
		expect(getAgentsListMock).toHaveBeenCalledTimes(2);
		expect(getAgentsListMock).toHaveBeenLastCalledWith(
			expect.objectContaining({
				page: 2,
			}),
		);

		await onLoading();
		await flushPromises();
		expect(getAgentsListMock).toHaveBeenCalledTimes(2);
	});

	it('clears the rows on unmount without loading the list again (ADR-0029)', async () => {
		const wrapper = mountTable();
		await flushPromises();

		wrapper.unmount();
		await flushPromises();

		expect(useTransferAgentsDataListStore().dataList).toEqual([]);
		expect(getAgentsListMock).toHaveBeenCalledTimes(1);
	});

	it('loads the list again on a remount with the same search', async () => {
		mountTable({
			search: 'jo',
		}).unmount();
		await flushPromises();

		mountTable({
			search: 'jo',
		});
		await flushPromises();

		expect(getAgentsListMock).toHaveBeenCalledTimes(2);
		expect(getAgentsListMock).toHaveBeenLastCalledWith(
			expect.objectContaining({
				search: 'jo',
				page: 1,
			}),
		);
	});

	it('selects a clicked row and passes it to the table as active', async () => {
		const wrapper = mountTable();
		await flushPromises();
		const table = wrapper.findComponent(WtTableStub);

		table.vm.$emit('row-click', {
			data: table.props('data')[1],
		});
		await flushPromises();

		expect(wrapper.props('selectedRowId')).toBe('2');
		expect(table.props('activeRow')).toEqual(
			expect.objectContaining({
				id: '2',
			}),
		);
	});

	it('clears the selection on a second click on the selected row (AC_13.07.10)', async () => {
		const wrapper = mountTable({
			selectedRowId: '2',
		});
		await flushPromises();
		const table = wrapper.findComponent(WtTableStub);

		table.vm.$emit('row-click', {
			data: table.props('data')[1],
		});
		await flushPromises();

		expect(wrapper.props('selectedRowId')).toBeNull();
		expect(table.props('activeRow')).toBeNull();
	});
});
