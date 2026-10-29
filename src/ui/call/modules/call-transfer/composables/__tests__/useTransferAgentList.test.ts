import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

const searchAgentsMock = vi.fn();

vi.mock('../../../../../../features/agents/api/searchAgents', () => ({
	searchAgents: (...args: unknown[]) => searchAgentsMock(...args),
}));

vi.mock('../../../../../../features/userinfo/stores/userinfoStore', () => ({
	useUserinfoStore: () => ({
		userId: 'me',
	}),
}));

import { useTransferAgentList } from '../useTransferAgentList';

const page = (ids: string[], next = false) => ({
	items: ids.map((id) => ({
		id,
		name: `Agent ${id}`,
	})),
	next,
});

describe('useTransferAgentList', () => {
	beforeEach(() => {
		searchAgentsMock.mockReset();
	});

	it('loads the first page at once, without the agent themself', async () => {
		searchAgentsMock.mockResolvedValue(
			page([
				'1',
				'2',
			]),
		);

		const { rows } = useTransferAgentList(ref(''));
		await flushPromises();

		expect(searchAgentsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				search: '',
				page: 1,
				excludedUserIds: [
					'me',
				],
			}),
		);
		expect(rows.value.map(({ id }) => id)).toEqual([
			'1',
			'2',
		]);
	});

	it('appends the next page while there is one', async () => {
		searchAgentsMock.mockResolvedValueOnce(
			page(
				[
					'1',
				],
				true,
			),
		);
		searchAgentsMock.mockResolvedValueOnce(
			page([
				'2',
			]),
		);

		const { rows, hasNextPage, loadNextPage } = useTransferAgentList(ref(''));
		await flushPromises();
		await loadNextPage();

		expect(searchAgentsMock).toHaveBeenLastCalledWith(
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
		searchAgentsMock.mockResolvedValueOnce(
			page([
				'1',
			]),
		);
		searchAgentsMock.mockResolvedValueOnce(
			page([
				'9',
			]),
		);
		const search = ref('');

		const { rows } = useTransferAgentList(search);
		await flushPromises();
		search.value = 'jo';
		await nextTick();
		await flushPromises();

		expect(searchAgentsMock).toHaveBeenLastCalledWith(
			expect.objectContaining({
				search: 'jo',
				page: 1,
			}),
		);
		expect(rows.value.map(({ id }) => id)).toEqual([
			'9',
		]);
	});

	it('drops the answer to an old search that arrives after the newer one', async () => {
		let answerOldSearch: (value: unknown) => void = () => {};
		searchAgentsMock.mockReturnValueOnce(
			new Promise((resolve) => {
				answerOldSearch = resolve;
			}),
		);
		searchAgentsMock.mockResolvedValueOnce(
			page([
				'9',
			]),
		);
		const search = ref('');

		const { rows } = useTransferAgentList(search);
		search.value = 'jo';
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
		searchAgentsMock.mockRejectedValue(new Error('boom'));

		const { rows, hasNextPage, isLoading } = useTransferAgentList(ref(''));
		await flushPromises();

		expect(rows.value).toEqual([]);
		expect(hasNextPage.value).toBe(false);
		expect(isLoading.value).toBe(false);
	});
});
