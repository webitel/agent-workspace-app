import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { FormatDateMode } from '@webitel/ui-sdk/enums';
import { formatDate } from '@webitel/ui-sdk/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive, ref } from 'vue';

/**
 * Stand-in for the ui-datalist table store: only the state and actions
 * the table reads, so the test covers our logic, not createTableStore
 */
const createStore = () => {
	let finishInitialize: () => void = () => {};

	const store = reactive({
		dataList: ref<EngineHistoryCall[]>([]),
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

vi.mock('../store/missed-calls', () => ({
	useMissedCallsDataListStore: () => mockStore,
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

// the stubbed phone cell still imports the calls store, which pulls in
// the socket client and the i18n singleton
vi.mock('../../../../../../../features/calls/store/calls', () => ({
	useCallsStore: () => ({}),
}));

import MissedCallsTable from '../missed-calls-table.vue';

const stubs = {
	UsernameTableCell: {
		name: 'UsernameTableCell',
		props: [
			'name',
		],
		template: '<div class="username-cell" />',
	},
	PhoneCallTableCell: {
		name: 'PhoneCallTableCell',
		props: [
			'phoneNumber',
		],
		template: '<div class="phone-cell" />',
	},
};

const mountTable = () =>
	mount(MissedCallsTable, {
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
			stubs,
		},
	});

const call: EngineHistoryCall = {
	id: '1',
	createdAt: '1790947707140',
	duration: 65,
	contact: {
		name: 'John Doe',
	},
	from: {
		name: 'John',
		number: '380501112233',
	},
	queue: {
		name: 'Support',
	},
};

const showColumns = (...values: string[]) => {
	mockStore.shownHeaders = values.map((value) => ({
		value,
	}));
};

const showCall = (row: EngineHistoryCall) => {
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

const nameOf = (wrapper: ReturnType<typeof mountTable>) =>
	wrapper
		.findComponent({
			name: 'UsernameTableCell',
		})
		.props('name');

describe('missed-calls-table', () => {
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
		describe('name', () => {
			beforeEach(() => {
				showColumns('name');
			});

			it('shows the contact name', () => {
				showCall(call);

				expect(nameOf(mountTable())).toBe('John Doe');
			});

			it('falls back to the caller name without a contact', () => {
				showCall({
					...call,
					contact: undefined,
				});

				expect(nameOf(mountTable())).toBe('John');
			});

			it('falls back to the caller number without a name', () => {
				showCall({
					...call,
					contact: undefined,
					from: {
						number: '380501112233',
					},
				});

				expect(nameOf(mountTable())).toBe('380501112233');
			});
		});

		it('formats the call date', () => {
			showColumns('createdAt');
			showCall(call);

			const wrapper = mountTable();

			expect(wrapper.find('.cell-createdAt').text()).toBe(
				formatDate(+call.createdAt, FormatDateMode.DATETIME),
			);
		});

		it('formats the duration with dots', () => {
			showColumns('duration');
			showCall(call);

			const wrapper = mountTable();

			expect(wrapper.find('.cell-duration').text()).toBe('00:01:05');
		});

		describe('queue', () => {
			beforeEach(() => {
				showColumns('queue');
			});

			it('shows the queue name', () => {
				showCall(call);

				const wrapper = mountTable();

				expect(wrapper.find('.cell-queue').text()).toBe('Support');
			});

			it('shows a dash without a queue', () => {
				showCall({
					...call,
					queue: undefined,
				});

				const wrapper = mountTable();

				expect(wrapper.find('.cell-queue').text()).toBe('–');
			});
		});

		it('passes the caller number to the phone cell', () => {
			showColumns('phone');
			showCall(call);

			const wrapper = mountTable();

			expect(
				wrapper
					.findComponent({
						name: 'PhoneCallTableCell',
					})
					.props('phoneNumber'),
			).toBe('380501112233');
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
