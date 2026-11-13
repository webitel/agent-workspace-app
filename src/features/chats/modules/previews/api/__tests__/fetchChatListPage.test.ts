import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchThreadsMock = vi.fn();
vi.mock('../../../../api/chatSdk', () => ({
	threadsService: {
		fetchThreads: (...args: unknown[]) => fetchThreadsMock(...args),
	},
}));

import { ChatListTab } from '../../enums/ChatListTab.enum';
import { CHAT_LIST_PAGE_SIZE, fetchChatListPage } from '../fetchChatListPage';

const query = (overrides: Record<string, unknown> = {}) => ({
	tab: ChatListTab.Active,
	threadIds: [
		't1',
		't2',
	],
	query: '',
	onlyUnread: false,
	page: 1,
	...overrides,
});

const sentParams = () => fetchThreadsMock.mock.calls[0][0];

describe('fetchChatListPage', () => {
	beforeEach(() => {
		fetchThreadsMock.mockReset();
		fetchThreadsMock.mockResolvedValue({
			items: [],
			next: false,
		});
	});

	it('scopes every page to the listed chats, in pages of the list size', async () => {
		await fetchChatListPage(
			query({
				page: 3,
			}),
		);

		expect(sentParams()).toMatchObject({
			ids: [
				't1',
				't2',
			],
			page: 3,
			size: CHAT_LIST_PAGE_SIZE,
			sort: '-updated_at',
		});
		expect(sentParams().fields).toEqual(
			expect.arrayContaining([
				'id',
				'last_msg',
				'unread_count',
				'channel',
				'members',
			]),
		);
	});

	it('leaves snoozed chats out of the Active tab', async () => {
		await fetchChatListPage(query());

		expect(sentParams().excludeTags).toEqual([
			'snoozed',
		]);
		expect(sentParams().tags).toBeUndefined();
	});

	it('reads only snoozed chats for the Snoozed tab', async () => {
		await fetchChatListPage(
			query({
				tab: ChatListTab.Snoozed,
			}),
		);

		expect(sentParams().tags).toEqual([
			'snoozed',
		]);
		expect(sentParams().excludeTags).toBeUndefined();
	});

	it('asks for unread chats only on Active with the filter on', async () => {
		await fetchChatListPage(
			query({
				onlyUnread: true,
			}),
		);
		await fetchChatListPage(
			query({
				tab: ChatListTab.Snoozed,
				onlyUnread: true,
			}),
		);
		await fetchChatListPage(query());

		expect(fetchThreadsMock.mock.calls[0][0].unread).toBe(true);
		expect(fetchThreadsMock.mock.calls[1][0].unread).toBeUndefined();
		expect(fetchThreadsMock.mock.calls[2][0].unread).toBeUndefined();
	});

	it('searches only when there is something to search for', async () => {
		await fetchChatListPage(
			query({
				query: 'anna',
			}),
		);
		await fetchChatListPage(query());

		expect(fetchThreadsMock.mock.calls[0][0].q).toBe('anna');
		expect(fetchThreadsMock.mock.calls[1][0].q).toBeUndefined();
	});

	// a read without ids would answer internal chats too
	it('does not ask the backend when the agent has no chats', async () => {
		const result = await fetchChatListPage(
			query({
				threadIds: [],
			}),
		);

		expect(fetchThreadsMock).not.toHaveBeenCalled();
		expect(result).toEqual({
			threads: [],
			next: false,
		});
	});

	it('hands the threads back with whether more follow', async () => {
		fetchThreadsMock.mockResolvedValue({
			items: [
				{
					id: 't1',
				},
			],
			next: true,
		});

		await expect(fetchChatListPage(query())).resolves.toEqual({
			threads: [
				{
					id: 't1',
				},
			],
			next: true,
		});
	});

	it('reads a missing next as the last page', async () => {
		fetchThreadsMock.mockResolvedValue({
			items: [],
		});

		await expect(fetchChatListPage(query())).resolves.toMatchObject({
			next: false,
		});
	});
});
