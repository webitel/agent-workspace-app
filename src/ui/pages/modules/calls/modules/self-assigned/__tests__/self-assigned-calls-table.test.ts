import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { FormatDateMode } from '@webitel/ui-sdk/enums';
import { formatDate } from '@webitel/ui-sdk/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive, ref, shallowRef } from 'vue';
import type { WaitingMemberCall } from 'webitel-sdk';
import { useSidebarSelectionStore } from '../../../../../../sidebar/store/sidebar-selection';

/**
 * Stand-in for the ui-datalist table store: only the state and actions
 * the table reads, so the test covers our logic, not createTableStore
 */
const createStore = () => {
	let finishInitialize: () => void = () => {};

	const store = reactive({
		dataList: ref<WaitingMemberCall[]>([]),
		shownHeaders: ref<
			{
				value: string;
			}[]
		>([]),
		loadDataList: vi.fn(),
		initialize: vi.fn(
			() =>
				new Promise<void>((resolve) => {
					finishInitialize = resolve;
				}),
		),
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

/** Stand-in for the SDK agent: only what the table reads */
const createAgent = () =>
	reactive({
		hasMoreWaitingCalls: true,
		loadMoreWaitingCalls: vi.fn(),
	});

let mockStore: ReturnType<typeof createStore>['store'];
const agent = shallowRef<ReturnType<typeof createAgent> | undefined>();

vi.mock('../store/self-assigned-calls', () => ({
	useSelfAssignedCallsDataListStore: () => mockStore,
}));

vi.mock(
	'../../../../../../../app/api/socket/composables/useWebSocketClient',
	() => ({
		useWebSocketClient: () => ({
			agent,
		}),
	}),
);

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
			<tr v-for="item in data" :key="item.attemptId" class="row">
				<td v-for="header in headers" :class="'cell-' + header.value">
					<slot :name="header.value" :item="item" />
				</td>
			</tr>
		</table>`,
	},
}));

vi.mock('../api/interceptSelfAssignedCall', () => ({
	interceptSelfAssignedCall: vi.fn(),
}));

const holdOtherLiveCalls = vi.fn();

vi.mock('../../../../../../../features/calls/store/calls', () => ({
	useCallsStore: () => ({
		holdOtherLiveCalls,
	}),
}));

import { interceptSelfAssignedCall } from '../api/interceptSelfAssignedCall';
import SelfAssignedCallsTable from '../self-assigned-calls-table.vue';

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
	SelfAssignedCallPhoneCell: {
		name: 'SelfAssignedCallPhoneCell',
		props: [
			'phoneNumber',
			'loading',
		],
		emits: [
			'answer',
		],
		template: '<div class="phone-cell" />',
	},
};

const mountTable = () =>
	mount(SelfAssignedCallsTable, {
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
			stubs,
		},
	});

const call: WaitingMemberCall = {
	attemptId: 1,
	sessionId: 'session-1',
	displayName: 'John Doe',
	displayNumber: '380501112233',
	joinedAt: 1790947707140,
	wait: 65,
	deadline: 0,
	queue: {
		id: 10,
		name: 'Support',
	},
	contact: {
		id: 42,
		name: 'John Contact',
	},
};

const showColumns = (...values: string[]) => {
	mockStore.shownHeaders = values.map((value) => ({
		value,
	}));
};

const showCall = (row: WaitingMemberCall) => {
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

const nameCellOf = (wrapper: ReturnType<typeof mountTable>) =>
	wrapper.findComponent({
		name: 'UsernameTableCell',
	});

const phoneCellOf = (wrapper: ReturnType<typeof mountTable>) =>
	wrapper.findComponent({
		name: 'SelfAssignedCallPhoneCell',
	});

describe('self-assigned-calls-table', () => {
	let finishInitialize: () => Promise<void>;

	beforeEach(() => {
		({ store: mockStore, finishInitialize } = createStore());
		agent.value = createAgent();
	});

	it('initializes the store on mount', () => {
		mountTable();

		expect(mockStore.initialize).toHaveBeenCalledTimes(1);
	});

	it('shows the calls from the store', () => {
		showCall(call);

		const wrapper = mountTable();

		expect(wrapper.findAll('.row')).toHaveLength(1);
	});

	describe('agent session changes', () => {
		it('reloads the list when the agent session appears', async () => {
			agent.value = undefined;
			mountTable();

			agent.value = createAgent();
			await flushPromises();

			expect(mockStore.loadDataList).toHaveBeenCalledTimes(1);
		});

		it('does not reload when the agent session is gone', async () => {
			mountTable();

			agent.value = undefined;
			await flushPromises();

			expect(mockStore.loadDataList).not.toHaveBeenCalled();
		});
	});

	describe('loading the next page on scroll', () => {
		it('waits until the store is initialized', async () => {
			const wrapper = mountTable();

			await onLoadingOf(wrapper)();

			expect(agent.value?.loadMoreWaitingCalls).not.toHaveBeenCalled();
		});

		it('asks the SDK for more once initialized', async () => {
			const wrapper = mountTable();
			await finishInitialize();

			await onLoadingOf(wrapper)();

			expect(agent.value?.loadMoreWaitingCalls).toHaveBeenCalledTimes(1);
		});

		it('skips when the SDK has no more calls', async () => {
			const wrapper = mountTable();
			await finishInitialize();
			if (agent.value) agent.value.hasMoreWaitingCalls = false;

			await onLoadingOf(wrapper)();

			expect(agent.value?.loadMoreWaitingCalls).not.toHaveBeenCalled();
		});
	});

	describe('cells', () => {
		describe('name', () => {
			beforeEach(() => {
				showColumns('name');
			});

			it('prefers the contact name', () => {
				showCall(call);

				const wrapper = mountTable();

				expect(nameCellOf(wrapper).props('name')).toBe('John Contact');
			});

			it('falls back to the caller name without a contact', () => {
				showCall({
					...call,
					contact: undefined,
				});

				const wrapper = mountTable();

				expect(nameCellOf(wrapper).props('name')).toBe('John Doe');
			});

			it('falls back to the number without any name', () => {
				showCall({
					...call,
					contact: undefined,
					displayName: '',
				});

				const wrapper = mountTable();

				expect(nameCellOf(wrapper).props('name')).toBe('380501112233');
			});
		});

		it('formats the date and time', () => {
			showColumns('joinedAt');
			showCall(call);

			const wrapper = mountTable();

			expect(wrapper.find('.cell-joinedAt').text()).toBe(
				formatDate(call.joinedAt, FormatDateMode.DATETIME),
			);
		});

		it('formats the wait time', () => {
			showColumns('wait');
			showCall(call);

			const wrapper = mountTable();

			expect(wrapper.find('.cell-wait').text()).toBe('00:01:05');
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

			it('shows a dash without a queue name', () => {
				showCall({
					...call,
					queue: {},
				});

				const wrapper = mountTable();

				expect(wrapper.find('.cell-queue').text()).toBe('–');
			});
		});

		it('passes the number to the phone cell', () => {
			showColumns('phone');
			showCall(call);

			const wrapper = mountTable();

			expect(phoneCellOf(wrapper).props('phoneNumber')).toBe('380501112233');
		});
	});

	describe('answering the call', () => {
		const interceptMock = vi.mocked(interceptSelfAssignedCall);

		beforeEach(() => {
			showColumns('phone');
			showCall(call);
			interceptMock.mockReset();
			interceptMock.mockResolvedValue(undefined);
			holdOtherLiveCalls.mockReset();
			holdOtherLiveCalls.mockResolvedValue(undefined);
		});

		it('intercepts the row attempt', async () => {
			const wrapper = mountTable();

			phoneCellOf(wrapper).vm.$emit('answer');
			await flushPromises();

			expect(interceptMock).toHaveBeenCalledWith(1);
		});

		it('holds the other live calls before intercepting', async () => {
			const wrapper = mountTable();

			phoneCellOf(wrapper).vm.$emit('answer');
			await flushPromises();

			expect(holdOtherLiveCalls).toHaveBeenCalledTimes(1);
			expect(holdOtherLiveCalls.mock.invocationCallOrder[0]).toBeLessThan(
				interceptMock.mock.invocationCallOrder[0],
			);
		});

		it('shows the loader while the request runs and ignores a second click', async () => {
			let finishRequest: () => void = () => {};
			interceptMock.mockImplementation(
				() =>
					new Promise<void>((resolve) => {
						finishRequest = resolve;
					}),
			);
			const wrapper = mountTable();

			phoneCellOf(wrapper).vm.$emit('answer');
			await flushPromises();
			phoneCellOf(wrapper).vm.$emit('answer');
			await flushPromises();

			expect(phoneCellOf(wrapper).props('loading')).toBe(true);
			expect(interceptMock).toHaveBeenCalledTimes(1);

			finishRequest();
			await flushPromises();

			expect(phoneCellOf(wrapper).props('loading')).toBe(false);
		});

		it('does not reload the list once intercepted', async () => {
			const wrapper = mountTable();

			phoneCellOf(wrapper).vm.$emit('answer');
			await flushPromises();

			expect(mockStore.loadDataList).not.toHaveBeenCalled();
		});

		it('only logs a refused intercept and drops the loader', async () => {
			const consoleError = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {});
			interceptMock.mockRejectedValue(new Error('refused'));
			const wrapper = mountTable();

			phoneCellOf(wrapper).vm.$emit('answer');
			await flushPromises();

			expect(consoleError).toHaveBeenCalled();
			expect(phoneCellOf(wrapper).props('loading')).toBe(false);
			consoleError.mockRestore();
		});
	});

	describe('opening the contact', () => {
		beforeEach(() => {
			showColumns('name');
		});

		it('selects the contact linked to the call', async () => {
			showCall(call);
			const wrapper = mountTable();

			await nameCellOf(wrapper).vm.$emit('click');
			const selectionStore = useSidebarSelectionStore();

			expect(selectionStore.selectContact).toHaveBeenCalledWith('42');
			expect(selectionStore.selectPhoneNumber).not.toHaveBeenCalled();
		});

		it('selects the call number without a linked contact', async () => {
			showCall({
				...call,
				contact: undefined,
			});
			const wrapper = mountTable();

			await nameCellOf(wrapper).vm.$emit('click');
			const selectionStore = useSidebarSelectionStore();

			expect(selectionStore.selectPhoneNumber).toHaveBeenCalledWith(
				'380501112233',
			);
			expect(selectionStore.selectContact).not.toHaveBeenCalled();
		});

		it('selects no number when the call has none', async () => {
			showCall({
				...call,
				contact: undefined,
				displayNumber: '',
			});
			const wrapper = mountTable();

			await nameCellOf(wrapper).vm.$emit('click');

			expect(useSidebarSelectionStore().selectPhoneNumber).toHaveBeenCalledWith(
				undefined,
			);
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
