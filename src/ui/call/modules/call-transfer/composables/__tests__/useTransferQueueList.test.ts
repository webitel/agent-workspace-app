import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

const searchQueuesMock = vi.fn();

vi.mock('../../../../../../features/queues/api/searchQueues', () => ({
	searchQueues: (...args: unknown[]) => searchQueuesMock(...args),
}));

import { useTransferQueueList } from '../useTransferQueueList';

const page = (ids: string[], next = false) => ({
	items: ids.map((id) => ({
		id,
		name: `Queue ${id}`,
	})),
	next,
});

describe('useTransferQueueList', () => {
	beforeEach(() => {
		searchQueuesMock.mockReset();
	});

	it('loads the first page at once', async () => {
		searchQueuesMock.mockResolvedValue(
			page([
				'1',
				'2',
			]),
		);

		const { rows } = useTransferQueueList(ref(''));
		await flushPromises();

		expect(searchQueuesMock).toHaveBeenCalledWith(
			expect.objectContaining({
				search: '',
				page: 1,
			}),
		);
		expect(rows.value.map(({ id }) => id)).toEqual([
			'1',
			'2',
		]);
	});

	it('appends the next page while there is one', async () => {
		searchQueuesMock.mockResolvedValueOnce(
			page(
				[
					'1',
				],
				true,
			),
		);
		searchQueuesMock.mockResolvedValueOnce(
			page([
				'2',
			]),
		);

		const { rows, hasNextPage, loadNextPage } = useTransferQueueList(ref(''));
		await flushPromises();
		await loadNextPage();

		expect(searchQueuesMock).toHaveBeenLastCalledWith(
			expect.objectContaining({
				page: 2,
			}),
		);
		expect(rows.value.map(({ id }) => id)).toEqual([
			'1',
			'2',
		]);
		expect(hasNextPage.value).toBe(false);
		expect(loadNextPage()).toBeUndefined();
	});

	it('starts over from the first page when the search changes', async () => {
		searchQueuesMock.mockResolvedValueOnce(
			page([
				'1',
			]),
		);
		searchQueuesMock.mockResolvedValueOnce(
			page([
				'9',
			]),
		);
		const search = ref('');

		const { rows } = useTransferQueueList(search);
		await flushPromises();
		search.value = 'sup';
		await nextTick();
		await flushPromises();

		expect(searchQueuesMock).toHaveBeenLastCalledWith(
			expect.objectContaining({
				search: 'sup',
				page: 1,
			}),
		);
		expect(rows.value.map(({ id }) => id)).toEqual([
			'9',
		]);
	});

	it('drops the answer to an old search that arrives after the newer one', async () => {
		let answerOldSearch: (value: unknown) => void = () => {};
		searchQueuesMock.mockReturnValueOnce(
			new Promise((resolve) => {
				answerOldSearch = resolve;
			}),
		);
		searchQueuesMock.mockResolvedValueOnce(
			page([
				'9',
			]),
		);
		const search = ref('');

		const { rows } = useTransferQueueList(search);
		search.value = 'sup';
		await nextTick();
		await flushPromises();
		answerOldSearch(
			page([
				'1',
			]),
		);
		await flushPromises();

		expect(rows.value.map(({ id }) => id)).toEqual([
			'9',
		]);
	});

	it('stops paging when a page fails to load', async () => {
		searchQueuesMock.mockRejectedValue(new Error('boom'));

		const { rows, hasNextPage, isLoading } = useTransferQueueList(ref(''));
		await flushPromises();

		expect(rows.value).toEqual([]);
		expect(hasNextPage.value).toBe(false);
		expect(isLoading.value).toBe(false);
	});
});
