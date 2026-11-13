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
		loadDataList: vi.fn(),
		updatePage: vi.fn(),
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

vi.mock('../api/callOfflineMember', () => ({
	callOfflineMember: vi.fn(),
}));

import { useSidebarSelectionStore } from '../../../../../../sidebar/store/sidebar-selection';
import { callOfflineMember } from '../api/callOfflineMember';
import OfflineCallsTable from '../offline-calls-table.vue';

const stubs = {
	UsernameTableCell: {
		name: 'UsernameTableCell',
		props: [
			'name',
			'clickable',
		],
		emits: [
			'click',
		],
		template: '<div class="username-cell" />',
	},
	OfflineMemberPhonesCell: {
		name: 'OfflineMemberPhonesCell',
		props: [
			'communications',
			'loading',
		],
		emits: [
			'call',
		],
		template: '<div class="phones-cell" />',
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

const phonesCellOf = (wrapper: ReturnType<typeof mountTable>) =>
	wrapper.findComponent({
		name: 'OfflineMemberPhonesCell',
	});

const onLoadingOf = (wrapper: ReturnType<typeof mountTable>) =>
	tableOf(wrapper).props('onLoading') as () => Promise<void>;

describe('offline-calls-table', () => {
	let finishInitialize: () => Promise<void>;

	beforeEach(() => {
		({ store: mockStore, finishInitialize } = createStore());
	});

	it('initializes the store on mount', () => {
		mountTable();

		expect(mockStore.initialize).toHaveBeenCalledTimes(1);
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

		it('passes the member communications to the phones cell', () => {
			showColumns('phone');
			showMember(member);

			const wrapper = mountTable();

			expect(phonesCellOf(wrapper).props('communications')).toEqual(
				member.communications,
			);
			expect(phonesCellOf(wrapper).props('loading')).toBe(false);
		});
	});

	describe('opening the member in the panel', () => {
		beforeEach(() => {
			showColumns('name');
		});

		it('selects the member first number on name click', () => {
			showMember(member);
			const wrapper = mountTable();

			wrapper
				.findComponent({
					name: 'UsernameTableCell',
				})
				.vm.$emit('click');

			expect(useSidebarSelectionStore().selectPhoneNumber).toHaveBeenCalledWith(
				'380501112233',
			);
		});

		it('selects no number for a member without communications', () => {
			showMember({
				...member,
				communications: [],
			});
			const wrapper = mountTable();

			wrapper
				.findComponent({
					name: 'UsernameTableCell',
				})
				.vm.$emit('click');

			expect(useSidebarSelectionStore().selectPhoneNumber).toHaveBeenCalledWith(
				undefined,
			);
		});
	});

	describe('calling the member', () => {
		const callMock = vi.mocked(callOfflineMember);

		beforeEach(() => {
			callMock.mockReset();
			showColumns('phone');
			showMember(member);
		});

		it('asks the queue to call the picked communication', async () => {
			const wrapper = mountTable();

			phonesCellOf(wrapper).vm.$emit('call', member.communications[1]);
			await flushPromises();

			expect(callMock).toHaveBeenCalledWith(1, 2);
		});

		it('reloads the list from its first page once the queue took the call', async () => {
			const wrapper = mountTable();

			phonesCellOf(wrapper).vm.$emit('call', member.communications[0]);
			await flushPromises();

			expect(mockStore.updatePage).toHaveBeenCalledWith(1);
			expect(mockStore.loadDataList).toHaveBeenCalledTimes(1);
		});

		it('shows the loader on the row while the request is pending', async () => {
			let finishCall: () => void = () => {};
			callMock.mockReturnValue(
				new Promise<void>((resolve) => {
					finishCall = resolve;
				}),
			);
			const wrapper = mountTable();

			phonesCellOf(wrapper).vm.$emit('call', member.communications[0]);
			await flushPromises();

			expect(phonesCellOf(wrapper).props('loading')).toBe(true);

			finishCall();
			await flushPromises();

			expect(phonesCellOf(wrapper).props('loading')).toBe(false);
		});

		it('sends one request at a time for a member', async () => {
			callMock.mockReturnValue(new Promise<void>(() => {}));
			const wrapper = mountTable();

			phonesCellOf(wrapper).vm.$emit('call', member.communications[0]);
			phonesCellOf(wrapper).vm.$emit('call', member.communications[1]);
			await flushPromises();

			expect(callMock).toHaveBeenCalledTimes(1);
		});

		it('leaves the list as it is when the queue refuses the call', async () => {
			const consoleError = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {});
			callMock.mockRejectedValue(new Error('refused'));
			const wrapper = mountTable();

			phonesCellOf(wrapper).vm.$emit('call', member.communications[0]);
			await flushPromises();

			expect(mockStore.loadDataList).not.toHaveBeenCalled();
			expect(phonesCellOf(wrapper).props('loading')).toBe(false);
			consoleError.mockRestore();
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
