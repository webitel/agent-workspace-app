import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import {
	type EngineCallFile,
	EngineCallFileType,
	type EngineHistoryCall,
} from '@webitel/api-services/gen/models';
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
				field?: string;
			}[]
		>([]),
		next: ref(true),
		isLoading: ref(false),
		filtersManager: ref({}),
		initialize: vi.fn(
			() =>
				new Promise<void>((resolve) => {
					finishInitialize = resolve;
				}),
		),
		appendToDataList: vi.fn(),
		columnResize: vi.fn(),
		columnReorder: vi.fn(),
		addFilter: vi.fn(),
		updateFilter: vi.fn(),
		deleteFilter: vi.fn(),
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

vi.mock('../store/calls-history', () => ({
	useCallsHistoryDataListStore: () => mockStore,
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
			'column-resize',
			'column-reorder',
		],
		template: `<table>
			<tr v-for="item in data" :key="item.id" class="row">
				<td v-for="header in headers" :class="'cell-' + header.value">
					<slot :name="header.value" :item="item" />
				</td>
				<td class="cell-actions"><slot name="actions" :item="item" /></td>
			</tr>
			<slot v-if="!data.length" name="empty" />
		</table>`,
	},
	WtPlayer: {
		name: 'WtPlayer',
		props: [
			'src',
		],
		emits: [
			'close',
		],
		template: '<div class="audio-player" />',
	},
}));

// the real filters entry point pulls in the library i18n setup
vi.mock('@webitel/ui-datalist/filters', () => ({
	ColumnFilterComponent: {
		template: '<div />',
	},
}));

// the stubbed phone cell still imports the calls store, which pulls in
// the socket client and the i18n singleton
vi.mock('../../../../../../../features/calls/store/calls', () => ({
	useCallsStore: () => ({}),
}));

import CallsHistoryTable from '../calls-history-table.vue';

const stubs = {
	teleport: true,
	'wt-empty': {
		props: [
			'text',
		],
		template: '<div class="empty">{{ text }}</div>',
	},
	'wt-call-media-metric': {
		name: 'WtCallMediaMetric',
		props: [
			'mosAvg',
		],
		template: '<div class="metric" />',
	},
	'wt-vidstack-player': {
		name: 'WtVidstackPlayer',
		props: [
			'src',
			'title',
		],
		emits: [
			'close',
		],
		template: '<div class="video-player" />',
	},
	CallsHistoryNameCell: true,
	CallsHistoryPhoneCell: true,
	CallsHistoryRowActions: {
		name: 'CallsHistoryRowActions',
		props: [
			'item',
		],
		emits: [
			'play',
			'show-info',
		],
		template: '<div class="row-actions" />',
	},
	CallsHistoryInfoPopup: {
		name: 'CallsHistoryInfoPopup',
		props: [
			'item',
		],
		emits: [
			'close',
		],
		template: '<div class="info-popup" />',
	},
};

const mountTable = () =>
	mount(CallsHistoryTable, {
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
	variables: {
		lang: 'uk',
	},
	qualityMetrics: {
		mosAvg: 4.2,
	},
};

const showColumns = (...values: string[]) => {
	mockStore.shownHeaders = values.map((value) => ({
		value,
	}));
};

const onLoadingOf = (wrapper: ReturnType<typeof mountTable>) =>
	wrapper
		.findComponent({
			name: 'WtTable',
		})
		.props('onLoading') as () => Promise<void>;

const rowActionsOf = (wrapper: ReturnType<typeof mountTable>) =>
	wrapper.findComponent({
		name: 'CallsHistoryRowActions',
	});

describe('calls-history-table', () => {
	let finishInitialize: () => Promise<void>;

	beforeEach(() => {
		({ store: mockStore, finishInitialize } = createStore());
	});

	describe('on mount', () => {
		it('does not add a date filter: the default period comes from the API', () => {
			mountTable();

			expect(mockStore.addFilter).not.toHaveBeenCalled();
		});

		it('initializes the store', () => {
			mountTable();

			expect(mockStore.initialize).toHaveBeenCalledTimes(1);
		});
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
		it('formats the call date', () => {
			mockStore.dataList = [
				call,
			];
			showColumns('createdAt');

			const wrapper = mountTable();

			expect(wrapper.find('.cell-createdAt').text()).toBe(
				formatDate(+(call.createdAt ?? 0), FormatDateMode.DATETIME),
			);
		});

		it('leaves the date empty when it is missing', () => {
			mockStore.dataList = [
				{
					id: '1',
				},
			];
			showColumns('createdAt');

			const wrapper = mountTable();

			expect(wrapper.find('.cell-createdAt').text()).toBe('');
		});

		it.each([
			[
				65,
				'00.01.05',
			],
			[
				undefined,
				'00.00.00',
			],
		])('shows duration %s as %s', (duration, text) => {
			mockStore.dataList = [
				{
					id: '1',
					duration,
				},
			];
			showColumns('duration');

			const wrapper = mountTable();

			expect(wrapper.find('.cell-duration').text()).toBe(text);
		});

		it('shows connection quality only when metrics exist', () => {
			mockStore.dataList = [
				call,
				{
					id: '2',
				},
			];
			showColumns('metrics');

			const wrapper = mountTable();
			const metrics = wrapper.findAllComponents({
				name: 'WtCallMediaMetric',
			});

			expect(metrics).toHaveLength(1);
			expect(metrics[0].props('mosAvg')).toBe(4.2);
		});

		it('shows a variable value in its variable column', () => {
			mockStore.dataList = [
				call,
				{
					id: '2',
				},
			];
			showColumns('variables.lang');

			const wrapper = mountTable();
			const cells = wrapper.findAll('[class="cell-variables.lang"]');

			expect(cells.map((cell) => cell.text())).toEqual([
				'uk',
				'',
			]);
		});
	});

	it('shows the empty state when there are no calls', () => {
		const wrapper = mountTable();

		expect(wrapper.find('.empty').text()).toBe('ui.reusable.nothingToShowHere');
	});

	it('passes column resize and reorder to the store', () => {
		const wrapper = mountTable();
		const table = wrapper.findComponent({
			name: 'WtTable',
		});

		table.vm.$emit('column-resize', 'resize-event');
		table.vm.$emit('column-reorder', 'reorder-event');

		expect(mockStore.columnResize).toHaveBeenCalledWith('resize-event');
		expect(mockStore.columnReorder).toHaveBeenCalledWith('reorder-event');
	});

	describe('call info popup', () => {
		it('opens for the row and closes', async () => {
			mockStore.dataList = [
				call,
			];
			const wrapper = mountTable();

			expect(wrapper.find('.info-popup').exists()).toBe(false);

			await rowActionsOf(wrapper).vm.$emit('show-info', call);
			const popup = wrapper.findComponent({
				name: 'CallsHistoryInfoPopup',
			});

			expect(popup.props('item')).toEqual(call);

			await popup.vm.$emit('close');

			expect(wrapper.find('.info-popup').exists()).toBe(false);
		});
	});

	describe('recording player', () => {
		const file = (type: EngineCallFileType): EngineCallFile => ({
			id: 'file',
			name: 'record',
			type,
		});

		beforeEach(() => {
			mockStore.dataList = [
				call,
			];
		});

		it('opens the audio player for an audio recording and closes it', async () => {
			const wrapper = mountTable();

			await rowActionsOf(wrapper).vm.$emit(
				'play',
				file(EngineCallFileType.FileTypeAudio),
			);

			expect(wrapper.find('.audio-player').exists()).toBe(true);
			expect(wrapper.find('.video-player').exists()).toBe(false);

			await wrapper
				.findComponent({
					name: 'WtPlayer',
				})
				.vm.$emit('close');

			expect(wrapper.find('.audio-player').exists()).toBe(false);
		});

		it('opens the video player for a video recording and closes it', async () => {
			const wrapper = mountTable();

			await rowActionsOf(wrapper).vm.$emit(
				'play',
				file(EngineCallFileType.FileTypeVideo),
			);
			const player = wrapper.findComponent({
				name: 'WtVidstackPlayer',
			});

			expect(player.props('title')).toBe('record');
			expect(wrapper.find('.audio-player').exists()).toBe(false);

			await player.vm.$emit('close');

			expect(wrapper.find('.video-player').exists()).toBe(false);
		});
	});
});
