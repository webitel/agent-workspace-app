import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive, ref } from 'vue';
import type { OfflineMember } from '../types/OfflineMember.types';

/**
 * Stand-in for the ui-datalist table store: only the state and actions
 * the table reads, so the test covers our logic, not createTableStore
 */
const createStore = () => {
	let finishInitialize: () => void = () => {};

	const store = reactive({
		dataList: ref<OfflineMember[]>([]),
		shownHeaders: ref<
			{
				value: string;
			}[]
		>([]),
		next: ref(true),
		isLoading: ref(false),
		initialize: vi.fn(
			() =>
				new Promise<void>((resolve) => {
					finishInitialize = resolve;
				}),
		),
		appendToDataList: vi.fn(),
		updateSort: vi.fn(),
		columnResize: vi.fn(),
		columnReorder: vi.fn(),
	});

	return {
		store,
		finishInitialize: async () => {
			finishInitialize();
			await flushPromises();
		},
	};
};

let mockStore: ReturnType<typeof createStore>['store'];

vi.mock('../store/offline-calls', () => ({
	useOfflineCallsDataListStore: () => mockStore,
}));

const useOfflineCallsAutoRefresh = vi.fn();

vi.mock('../composables/useOfflineCallsAutoRefresh', () => ({
	useOfflineCallsAutoRefresh: (...args: unknown[]) =>
		useOfflineCallsAutoRefresh(...args),
}));

vi.mock('@webitel/ui-sdk/components', () => ({
	WtTable: {
		name: 'WtTable',
		props: [
			'data',
			'headers',
			'onLoading',
		],
		emits: [
			'sort',
			'column-resize',
			'column-reorder',
		],
		template: `<table>
			<tr v-for="item in data" :key="item.id" class="row">
				<td v-for="header in headers" :class="'cell-' + header.value">
					<slot :name="header.value" :item="item" />
				</td>
			</tr>
		</table>`,
	},
}));

import OfflineCallsTable from '../offline-calls-table.vue';

const stubs = {
	UsernameTableCell: {
		name: 'UsernameTableCell',
		props: [
			'name',
		],
		template: '<div class="username-cell" />',
	},
};

const mountTable = () =>
	mount(OfflineCallsTable, {
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
			stubs,
		},
	});

const member: OfflineMember = {
	id: 1,
	name: 'John Doe',
	queue: {
		id: 10,
		name: 'Support',
	},
	communications: [
		{
			id: 1,
			destination: '380501112233',
			channel: 'Phone',
			type: {
				id: 1,
				name: 'Mobile',
			},
		},
		{
			id: 2,
			destination: '380671112233',
			channel: 'Phone',
			type: {
				id: 2,
				name: 'Work',
			},
		},
	],
};

const showColumns = (...values: string[]) => {
	mockStore.shownHeaders = values.map((value) => ({
		value,
	}));
};

const showMember = (row: OfflineMember) => {
	mockStore.dataList = [
		row,
	];
};

const tableOf = (wrapper: ReturnType<typeof mountTable>) =>
	wrapper.findComponent({
		name: 'WtTable',
	});

const onLoadingOf = (wrapper: ReturnType<typeof mountTable>) =>
	tableOf(wrapper).props('onLoading') as () => Promise<void>;

describe('offline-calls-table', () => {
	let finishInitialize: () => Promise<void>;

	beforeEach(() => {
		({ store: mockStore, finishInitialize } = createStore());
		useOfflineCallsAutoRefresh.mockClear();
	});

	it('initializes the store on mount', () => {
		mountTable();

		expect(mockStore.initialize).toHaveBeenCalledTimes(1);
	});

	it('starts the auto refresh with the table store', () => {
		mountTable();

		expect(useOfflineCallsAutoRefresh).toHaveBeenCalledWith(mockStore);
	});

	describe('loading the next page on scroll', () => {
		it('waits until the store is initialized', async () => {
			const wrapper = mountTable();

			await onLoadingOf(wrapper)();

			expect(mockStore.appendToDataList).not.toHaveBeenCalled();
		});

		it('appends the next page once initialized', async () => {
			const wrapper = mountTable();
			await finishInitialize();

			await onLoadingOf(wrapper)();

			expect(mockStore.appendToDataList).toHaveBeenCalledTimes(1);
		});

		it('skips while a page is already loading', async () => {
			const wrapper = mountTable();
			await finishInitialize();
			mockStore.isLoading = true;

			await onLoadingOf(wrapper)();

			expect(mockStore.appendToDataList).not.toHaveBeenCalled();
		});

		it('skips when there are no more pages', async () => {
			const wrapper = mountTable();
			await finishInitialize();
			mockStore.next = false;

			await onLoadingOf(wrapper)();

			expect(mockStore.appendToDataList).not.toHaveBeenCalled();
		});
	});

	describe('cells', () => {
		it('passes the member name to the name cell', () => {
			showColumns('name');
			showMember(member);

			const wrapper = mountTable();

			expect(
				wrapper
					.findComponent({
						name: 'UsernameTableCell',
					})
					.props('name'),
			).toBe('John Doe');
		});

		describe('queue', () => {
			beforeEach(() => {
				showColumns('queue');
			});

			it('shows the queue name', () => {
				showMember(member);

				const wrapper = mountTable();

				expect(wrapper.find('.cell-queue').text()).toBe('Support');
			});

			it('shows a dash without a queue name', () => {
				showMember({
					...member,
					queue: {
						id: 10,
						name: '',
					},
				});

				const wrapper = mountTable();

				expect(wrapper.find('.cell-queue').text()).toBe('–');
			});
		});

		describe('phone', () => {
			beforeEach(() => {
				showColumns('phone');
			});

			it('shows the first communication number', () => {
				showMember(member);

				const wrapper = mountTable();

				expect(wrapper.find('.cell-phone').text()).toBe('380501112233');
			});

			it('stays empty without communications', () => {
				showMember({
					...member,
					communications: [],
				});

				const wrapper = mountTable();

				expect(wrapper.find('.cell-phone').text()).toBe('');
			});
		});
	});

	describe('table events', () => {
		it('passes sorting to the store', () => {
			const wrapper = mountTable();

			tableOf(wrapper).vm.$emit('sort', 'column', 'order');

			expect(mockStore.updateSort).toHaveBeenCalledWith('column', 'order');
		});

		it('passes column resize and reorder to the store', () => {
			const wrapper = mountTable();

			tableOf(wrapper).vm.$emit('column-resize', 'resize-event');
			tableOf(wrapper).vm.$emit('column-reorder', 'reorder-event');

			expect(mockStore.columnResize).toHaveBeenCalledWith('resize-event');
			expect(mockStore.columnReorder).toHaveBeenCalledWith('reorder-event');
		});
	});
});
