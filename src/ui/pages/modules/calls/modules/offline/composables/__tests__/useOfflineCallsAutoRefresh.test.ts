import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type EffectScope, effectScope, reactive, ref } from 'vue';

const getList = vi.fn();

vi.mock('../../api/offlineMembersApiModule', () => ({
	offlineMembersApiModule: {
		getList: (...args: unknown[]) => getList(...args),
	},
}));

import { useOfflineCallsAutoRefresh } from '../useOfflineCallsAutoRefresh';

const REFRESH_INTERVAL = 15 * 1000;

/**
 * Stand-in for the ui-datalist table store: only the state the refresh reads
 * and writes, so the test covers our logic, not createTableStore
 */
const createStore = () =>
	reactive({
		dataList: ref([
			{
				id: 1,
			},
			{
				id: 2,
			},
		]),
		isLoading: ref(false),
		sort: ref<string | null>('-name'),
		size: ref(1),
		next: ref(true),
		filtersManager: ref({
			getAllValues: () => ({
				search: 'john',
			}),
		}),
	});

const freshItems = [
	{
		id: 3,
	},
];

let store: ReturnType<typeof createStore>;
let scope: EffectScope;
let isPageHidden: boolean;

const startRefresh = () => {
	scope = effectScope();
	scope.run(() =>
		useOfflineCallsAutoRefresh(
			store as unknown as Parameters<typeof useOfflineCallsAutoRefresh>[0],
		),
	);
};

const tick = async () => {
	vi.advanceTimersByTime(REFRESH_INTERVAL);
	await flushPromises();
};

describe('useOfflineCallsAutoRefresh', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		getList.mockReset();
		getList.mockResolvedValue({
			items: freshItems,
			next: false,
		});
		store = createStore();
		isPageHidden = false;
		vi.spyOn(document, 'hidden', 'get').mockImplementation(() => isPageHidden);
	});

	afterEach(() => {
		scope.stop();
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it('does not refresh before the first interval passes', async () => {
		startRefresh();
		await flushPromises();

		expect(getList).not.toHaveBeenCalled();
	});

	it('re-requests every loaded row as the first page with current filters and sort', async () => {
		startRefresh();

		await tick();

		expect(getList).toHaveBeenCalledWith({
			search: 'john',
			sort: '-name',
			page: 1,
			size: 2,
		});
	});

	it('requests at least one page when the list is empty', async () => {
		store.dataList = [];
		store.size = 20;
		startRefresh();

		await tick();

		expect(getList).toHaveBeenCalledWith(
			expect.objectContaining({
				size: 20,
			}),
		);
	});

	it('replaces the list and the next flag with the reply', async () => {
		startRefresh();

		await tick();

		expect(store.dataList).toEqual(freshItems);
		expect(store.next).toBe(false);
	});

	it('skips the tick while the store is loading', async () => {
		store.isLoading = true;
		startRefresh();

		await tick();

		expect(getList).not.toHaveBeenCalled();
	});

	it('skips the tick while the page is hidden', async () => {
		isPageHidden = true;
		startRefresh();

		await tick();

		expect(getList).not.toHaveBeenCalled();
	});

	describe('drops a reply that came after the list changed', () => {
		let resolveRequest: (value: unknown) => void;

		beforeEach(() => {
			getList.mockReturnValue(
				new Promise((resolve) => {
					resolveRequest = resolve;
				}),
			);
			startRefresh();
			vi.advanceTimersByTime(REFRESH_INTERVAL);
		});

		const finishRequest = async () => {
			resolveRequest({
				items: freshItems,
				next: false,
			});
			await flushPromises();
		};

		it('when the list was reloaded', async () => {
			const reloaded = [
				{
					id: 9,
				},
			];
			store.dataList = reloaded;

			await finishRequest();

			expect(store.dataList).toEqual(reloaded);
		});

		it('when the next page was appended', async () => {
			store.dataList.push({
				id: 9,
			});

			await finishRequest();

			expect(store.dataList).toHaveLength(3);
			expect(store.next).toBe(true);
		});

		it('when the store is loading', async () => {
			store.isLoading = true;

			await finishRequest();

			expect(store.dataList).toHaveLength(2);
		});
	});

	it('skips the tick while the previous request is still pending', async () => {
		getList.mockReturnValue(new Promise(() => {}));
		startRefresh();

		await tick();
		await tick();

		expect(getList).toHaveBeenCalledTimes(1);
	});

	it('refreshes again on the next tick after a request fails', async () => {
		getList.mockRejectedValueOnce(new Error('socket error'));
		startRefresh();

		await tick();
		await tick();

		expect(getList).toHaveBeenCalledTimes(2);
		expect(store.dataList).toEqual(freshItems);
	});

	it('keeps the list when the request fails', async () => {
		getList.mockRejectedValue(new Error('socket error'));
		startRefresh();

		await tick();

		expect(store.dataList).toHaveLength(2);
		expect(store.next).toBe(true);
	});

	it('stops polling when the owner scope is disposed', async () => {
		startRefresh();
		scope.stop();

		await tick();

		expect(getList).not.toHaveBeenCalled();
	});
});
