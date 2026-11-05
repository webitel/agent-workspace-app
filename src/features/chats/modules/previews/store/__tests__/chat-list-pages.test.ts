import { describe, expect, it, vi } from 'vitest';

import { type ChatListPage, createChatListPages } from '../chat-list-pages';

const page = (threadIds: string[], next = false): ChatListPage => ({
	threadIds,
	next,
});

describe('createChatListPages', () => {
	it('starts stale and empty, with more to read', () => {
		const pages = createChatListPages(vi.fn());

		expect(pages.threadIds.value).toEqual([]);
		expect(pages.hasNext.value).toBe(true);
		expect(pages.isLoaded.value).toBe(false);
		expect(pages.isStale.value).toBe(true);
	});

	it('reads the first page, then the next ones, until there is none', async () => {
		const loadPage = vi
			.fn()
			.mockResolvedValueOnce(
				page(
					[
						't1',
						't2',
					],
					true,
				),
			)
			.mockResolvedValueOnce(
				page([
					't3',
				]),
			);
		const pages = createChatListPages(loadPage);

		await pages.loadFirst();
		await pages.loadNext();
		await pages.loadNext();

		expect(loadPage.mock.calls).toEqual([
			[
				1,
			],
			[
				2,
			],
		]);
		expect(pages.threadIds.value).toEqual([
			't1',
			't2',
			't3',
		]);
		expect(pages.hasNext.value).toBe(false);
		expect(pages.isLoaded.value).toBe(true);
		expect(pages.isStale.value).toBe(false);
	});

	it('reads one page at a time', async () => {
		const loadPage = vi.fn().mockResolvedValue(
			page(
				[
					't1',
				],
				true,
			),
		);
		const pages = createChatListPages(loadPage);

		const first = pages.loadNext();
		void pages.loadNext();
		expect(pages.isLoading.value).toBe(true);
		await first;

		expect(loadPage).toHaveBeenCalledOnce();
		expect(pages.isLoading.value).toBe(false);
	});

	it('starts again from the first page', async () => {
		const loadPage = vi
			.fn()
			.mockResolvedValueOnce(
				page(
					[
						't1',
					],
					true,
				),
			)
			.mockResolvedValueOnce(
				page([
					't9',
				]),
			);
		const pages = createChatListPages(loadPage);
		await pages.loadNext();

		await pages.loadFirst();

		expect(loadPage).toHaveBeenLastCalledWith(1);
		expect(pages.threadIds.value).toEqual([
			't9',
		]);
	});

	// a page read for an older search must not land on the new one
	it('drops a page that answers after a reset', async () => {
		let answerOld: (result: ChatListPage) => void = () => {};
		const loadPage = vi
			.fn()
			.mockReturnValueOnce(
				new Promise((resolve) => {
					answerOld = resolve;
				}),
			)
			.mockResolvedValueOnce(
				page([
					'new',
				]),
			);
		const pages = createChatListPages(loadPage);

		const old = pages.loadNext();
		await pages.loadFirst();
		answerOld(
			page([
				'old',
			]),
		);
		await old;

		expect(pages.threadIds.value).toEqual([
			'new',
		]);
	});

	it('skips the chats already shown, moved in live', async () => {
		const loadPage = vi.fn().mockResolvedValue(
			page([
				't1',
				't2',
			]),
		);
		const pages = createChatListPages(loadPage);
		pages.upsertTop('t2');

		await pages.loadNext();

		expect(pages.threadIds.value).toEqual([
			't2',
			't1',
		]);
	});

	it('reads on past a page that brings nothing new, three times at most', async () => {
		const loadPage = vi.fn().mockResolvedValue(
			page(
				[
					't1',
				],
				true,
			),
		);
		const pages = createChatListPages(loadPage);
		pages.upsertTop('t1');

		await pages.loadNext();

		expect(loadPage).toHaveBeenCalledTimes(4);
		expect(pages.threadIds.value).toEqual([
			't1',
		]);
	});

	it('keeps the rows when a page fails, and reads the same page next time', async () => {
		const loadPage = vi
			.fn()
			.mockResolvedValueOnce(
				page(
					[
						't1',
					],
					true,
				),
			)
			.mockRejectedValueOnce(new Error('boom'))
			.mockResolvedValueOnce(
				page([
					't2',
				]),
			);
		const pages = createChatListPages(loadPage);
		await pages.loadNext();

		await pages.loadNext();
		expect(pages.error.value).toBeInstanceOf(Error);
		expect(pages.threadIds.value).toEqual([
			't1',
		]);
		expect(pages.hasNext.value).toBe(true);
		expect(pages.isLoading.value).toBe(false);

		await pages.loadNext();
		expect(loadPage).toHaveBeenLastCalledWith(2);
		expect(pages.error.value).toBeNull();
		expect(pages.threadIds.value).toEqual([
			't1',
			't2',
		]);
	});

	it('moves a chat to the top, or puts it there', () => {
		const pages = createChatListPages(vi.fn());
		pages.upsertTop('t1');
		pages.upsertTop('t2');

		pages.upsertTop('t1');

		expect(pages.threadIds.value).toEqual([
			't1',
			't2',
		]);
		expect(pages.has('t2')).toBe(true);
	});

	it('removes a chat and keeps the order of the rest', () => {
		const pages = createChatListPages(vi.fn());
		pages.upsertTop('t3');
		pages.upsertTop('t2');
		pages.upsertTop('t1');

		pages.remove('t2');
		pages.remove('absent');

		expect(pages.threadIds.value).toEqual([
			't1',
			't3',
		]);
	});

	it('is marked stale until read again', async () => {
		const pages = createChatListPages(vi.fn().mockResolvedValue(page([])));
		await pages.loadFirst();

		pages.markStale();
		expect(pages.isStale.value).toBe(true);

		await pages.loadFirst();
		expect(pages.isStale.value).toBe(false);
	});
});
