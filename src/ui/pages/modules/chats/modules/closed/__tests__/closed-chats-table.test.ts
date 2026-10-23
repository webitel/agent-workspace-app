import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { FormatDateMode } from '@webitel/ui-sdk/enums';
import { formatDate } from '@webitel/ui-sdk/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive, ref } from 'vue';
import type { ClosedChatRow } from '../api/closedChatsApiModule';

/**
 * Stand-in for the ui-datalist table store: only the state and actions
 * the table reads, so the test covers our logic, not createTableStore
 */
const createStore = () => {
	let finishInitialize: () => void = () => {};

	const store = reactive({
		dataList: ref<ClosedChatRow[]>([]),
		selected: ref<ClosedChatRow[]>([]),
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
		updateSelected: vi.fn(),
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

vi.mock('../store/closed-chats', () => ({
	useClosedChatsDataListStore: () => mockStore,
}));

const mockCreateLeftThread = vi.fn();
const mockSeedClosedChat = vi.fn();
const mockOpenChat = vi.fn();
const order: string[] = [];

vi.mock('@webitel/chat-web-sdk', () => ({
	createLeftThread: (...args: unknown[]) => {
		order.push('createLeftThread');
		return mockCreateLeftThread(...args);
	},
}));

vi.mock('../../../../../../../features/chats/api/chatSdk', () => ({
	serviceConfig: 'service-config',
}));

vi.mock(
	'../../../../../../../features/chats/modules/closed/store/closed-chat',
	() => ({
		seedClosedChat: (...args: unknown[]) => {
			order.push('seedClosedChat');
			return mockSeedClosedChat(...args);
		},
	}),
);

vi.mock('../../../../../../../features/chats/store/chats', () => ({
	useChatsStore: () => ({
		openChat: (...args: unknown[]) => {
			order.push('openChat');
			return mockOpenChat(...args);
		},
	}),
}));

vi.mock('@webitel/ui-sdk/components', () => ({
	WtTable: {
		name: 'WtTable',
		props: {
			data: Array,
			headers: Array,
			selected: Array,
			onLoading: Function,
			sortable: {
				type: Boolean,
				default: false,
			},
		},
		emits: [
			'column-resize',
			'column-reorder',
			'update:selected',
		],
		template: `<table>
			<tr v-for="item in data" :key="item.id" class="row">
				<td v-for="header in headers" :class="'cell-' + header.value">
					<slot :name="header.value" :item="item">{{ 'plain:' + item[header.value] }}</slot>
				</td>
				<td class="cell-actions"><slot name="actions" :item="item" /></td>
			</tr>
		</table>`,
	},
}));

import ClosedChatsTable from '../closed-chats-table.vue';

const stubs = {
	'wt-icon-btn': {
		name: 'WtIconBtn',
		props: [
			'icon',
		],
		emits: [
			'click',
		],
		template: '<button class="chat-btn" @click="$emit(\'click\')" />',
	},
};

const mountTable = () =>
	mount(ClosedChatsTable, {
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
			stubs,
		},
	});

const chat = {
	id: '1',
	name: 'John Doe',
	username: 'john',
	thread: {
		id: '1',
	},
} as ClosedChatRow;

const showColumns = (...values: string[]) => {
	mockStore.shownHeaders = values.map((value) => ({
		value,
	}));
};

const tableOf = (wrapper: ReturnType<typeof mountTable>) =>
	wrapper.findComponent({
		name: 'WtTable',
	});

describe('closed-chats-table', () => {
	let finishInitialize: () => Promise<void>;

	beforeEach(() => {
		({ store: mockStore, finishInitialize } = createStore());
		mockCreateLeftThread.mockReset();
		mockSeedClosedChat.mockReset();
		mockOpenChat.mockReset();
		order.length = 0;
	});

	it('initializes the store on mount', () => {
		mountTable();

		expect(mockStore.initialize).toHaveBeenCalledTimes(1);
	});

	it('does not make columns sortable', () => {
		const wrapper = mountTable();

		expect(tableOf(wrapper).props('sortable')).toBe(false);
	});

	describe('loading the next page on scroll', () => {
		it('waits until the store is initialized', async () => {
			const wrapper = mountTable();

			await (tableOf(wrapper).props('onLoading') as () => Promise<void>)();

			expect(mockStore.appendToDataList).not.toHaveBeenCalled();
		});

		it('appends the next page once initialized', async () => {
			const wrapper = mountTable();
			await finishInitialize();

			await (tableOf(wrapper).props('onLoading') as () => Promise<void>)();

			expect(mockStore.appendToDataList).toHaveBeenCalledTimes(1);
		});
	});

	describe('cells', () => {
		beforeEach(() => {
			mockStore.dataList = [
				chat,
			];
		});

		it('shows the name as plain text', () => {
			showColumns('name');

			const wrapper = mountTable();

			expect(wrapper.find('.cell-name').text()).toBe('plain:John Doe');
		});

		it.each([
			'startedAt',
			'endedAt',
			'duration',
		])('leaves %s empty when the row has none', (column) => {
			// without its slot the stub would render the 'plain:' fallback
			showColumns(column);

			const wrapper = mountTable();

			expect(wrapper.find(`.cell-${column}`).text()).toBe('');
		});
	});

	describe('cells with values', () => {
		const STARTED_AT = 1790947707140;
		const ENDED_AT = 1790947772140;

		it('formats the dates and the duration', () => {
			mockStore.dataList = [
				{
					...chat,
					startedAt: STARTED_AT,
					endedAt: ENDED_AT,
					duration: 65,
				},
			];
			showColumns('startedAt', 'endedAt', 'duration');

			const wrapper = mountTable();

			expect(wrapper.find('.cell-startedAt').text()).toBe(
				formatDate(STARTED_AT, FormatDateMode.DATETIME),
			);
			expect(wrapper.find('.cell-endedAt').text()).toBe(
				formatDate(ENDED_AT, FormatDateMode.DATETIME),
			);
			expect(wrapper.find('.cell-duration').text()).toBe('00:01:05');
		});
	});

	describe('opening a chat', () => {
		it('seeds the card with the row thread, then opens the chat', () => {
			mockStore.dataList = [
				chat,
			];
			const leftThread = {
				id: '1',
			};
			mockCreateLeftThread.mockReturnValue(leftThread);
			const wrapper = mountTable();

			wrapper
				.findComponent({
					name: 'WtIconBtn',
				})
				.vm.$emit('click');

			expect(mockCreateLeftThread).toHaveBeenCalledWith(chat.thread, {
				serviceConfig: 'service-config',
			});
			expect(mockSeedClosedChat).toHaveBeenCalledWith(leftThread);
			expect(mockOpenChat).toHaveBeenCalledWith('1');
			expect(order).toEqual([
				'createLeftThread',
				'seedClosedChat',
				'openChat',
			]);
		});
	});

	describe('table events', () => {
		it('passes the selected rows to the store', () => {
			const wrapper = mountTable();

			tableOf(wrapper).vm.$emit('update:selected', [
				chat,
			]);

			expect(mockStore.updateSelected).toHaveBeenCalledWith([
				chat,
			]);
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
