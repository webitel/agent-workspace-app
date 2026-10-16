import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { FormatDateMode } from '@webitel/ui-sdk/enums';
import { formatDate } from '@webitel/ui-sdk/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive, ref } from 'vue';
import type { ActiveChatRow } from '../api/activeChatsApiModule';

/**
 * Stand-in for the ui-datalist table store: only the state and actions
 * the table reads, so the test covers our logic, not createTableStore
 */
const createStore = () => {
	let finishInitialize: () => void = () => {};

	const store = reactive({
		dataList: ref<ActiveChatRow[]>([]),
		selected: ref<ActiveChatRow[]>([]),
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

vi.mock('../store/active-chats', () => ({
	useActiveChatsDataListStore: () => mockStore,
}));

vi.mock('@webitel/ui-sdk/components', () => ({
	WtTable: {
		name: 'WtTable',
		props: [
			'data',
			'headers',
			'selected',
			'onLoading',
		],
		emits: [
			'sort',
			'column-resize',
			'column-reorder',
			'update:selected',
		],
		template: `<table>
			<tr v-for="item in data" :key="item.id" class="row">
				<td v-for="header in headers" :class="'cell-' + header.value">
					<slot :name="header.value" :item="item" />
				</td>
				<td class="cell-actions"><slot name="actions" :item="item" /></td>
			</tr>
		</table>`,
	},
}));

import ActiveChatsTable from '../active-chats-table.vue';

const stubs = {
	'wt-icon-btn': {
		name: 'WtIconBtn',
		props: [
			'icon',
		],
		template: '<button class="chat-btn" />',
	},
	UsernameTableCell: {
		name: 'UsernameTableCell',
		props: [
			'name',
		],
		template: '<div class="username-cell" />',
	},
};

const mountTable = () =>
	mount(ActiveChatsTable, {
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
			stubs,
		},
	});

const chat: ActiveChatRow = {
	id: '1',
	name: 'John Doe',
	username: 'john',
	message: 'Hello',
	startedAt: 1790947707140,
	duration: 65,
};

const showColumns = (...values: string[]) => {
	mockStore.shownHeaders = values.map((value) => ({
		value,
	}));
};

const tableOf = (wrapper: ReturnType<typeof mountTable>) =>
	wrapper.findComponent({
		name: 'WtTable',
	});

const onLoadingOf = (wrapper: ReturnType<typeof mountTable>) =>
	tableOf(wrapper).props('onLoading') as () => Promise<void>;

describe('active-chats-table', () => {
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
		beforeEach(() => {
			mockStore.dataList = [
				chat,
			];
		});

		it('shows the client name with an avatar', () => {
			showColumns('name');

			const wrapper = mountTable();

			expect(
				wrapper
					.findComponent({
						name: 'UsernameTableCell',
					})
					.props('name'),
			).toBe('John Doe');
		});

		it('formats the start date', () => {
			showColumns('startedAt');

			const wrapper = mountTable();

			expect(wrapper.find('.cell-startedAt').text()).toBe(
				formatDate(chat.startedAt, FormatDateMode.DATETIME),
			);
		});

		it('formats the duration', () => {
			showColumns('duration');

			const wrapper = mountTable();

			expect(wrapper.find('.cell-duration').text()).toBe('00:01:05');
		});

		it('shows the chat action in every row', () => {
			mockStore.dataList = [
				chat,
				{
					...chat,
					id: '2',
				},
			];

			const wrapper = mountTable();
			const buttons = wrapper.findAllComponents({
				name: 'WtIconBtn',
			});

			expect(buttons).toHaveLength(2);
			expect(buttons[0].props('icon')).toBe('ws-chat');
		});
	});

	describe('table events', () => {
		it('passes sorting to the store', () => {
			const wrapper = mountTable();

			tableOf(wrapper).vm.$emit('sort', 'column', 'order');

			expect(mockStore.updateSort).toHaveBeenCalledWith('column', 'order');
		});

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
