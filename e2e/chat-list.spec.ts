import type { Page } from '@playwright/test';

import {
	chatDistribute,
	chatTaskFrame,
	type MockedSocket,
	queryList,
} from './fixtures/mocks';
import { expect, test } from './fixtures/test';

/**
 * The chat list's Active tab (US_02.01): the chats the agent has accepted,
 * read page by page from the chat backend's thread list and loaded on scroll,
 * searchable and narrowable to unread. Also its tab indicators
 * (US_02.12) and the Snoozed tab (US_02.02), fed by the chat backend's snoozed
 * threads (ADR-0008) and unread chats (ADR-0011).
 */

const firstAttemptId = 200;

/** Distributes and bridges `count` chats, each in its own thread. */
function acceptChats(socket: MockedSocket, count: number) {
	for (let index = 0; index < count; index += 1) {
		const attemptId = firstAttemptId + index;
		socket.send(
			'channel',
			chatTaskFrame('distribute', {
				attemptId,
				distribute: chatDistribute({
					threadId: `e2e-thread-${index}`,
					subject: `Client ${index}`,
				}),
			}),
		);
		socket.send(
			'channel',
			chatTaskFrame('bridged', {
				attemptId,
			}),
		);
	}
}

const threadIndex = (threadId: string) =>
	Number(threadId.replace('e2e-thread-', ''));

/**
 * The chat backend's thread list as the chat list reads it: a page
 * of the asked threads, split by the snoozed tag, searched by the client's name
 * and narrowed to unread, the chat accepted last first. Without `ids` it
 * answers every thread it knows of, as the snoozed and unread reads ask.
 * `failUnread` makes the read of the unread chats fail. Holds every request,
 * for the specs to look at.
 */
async function threadList(
	page: Page,
	{
		snoozed = [],
		unread = {},
		failUnread = false,
	}: {
		snoozed?: string[];
		unread?: Record<string, number>;
		failUnread?: boolean;
	} = {},
) {
	const requests: URLSearchParams[] = [];
	await page.route(
		(url) => url.pathname.endsWith('/api/v1/threads'),
		async (route) => {
			const params = new URL(route.request().url()).searchParams;
			requests.push(params);
			const ids = queryList(params, 'ids');
			const isUnreadOnly = params.get('unread') === 'true';
			// the read of every unread chat, not a page narrowed to unread
			if (isUnreadOnly && failUnread && !ids.length) {
				await route.fulfill({
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify({
						message: 'failed',
					}),
				});
				return;
			}

			const tags = queryList(params, 'tags');
			const excluded = queryList(params, 'exclude_tags');
			const search = params.get('q')?.toLowerCase();
			const known = [
				...new Set([
					...ids,
					...snoozed,
					...Object.keys(unread),
				]),
			];
			const matching = (ids.length ? ids : known)
				.filter((id) => !tags.includes('snoozed') || snoozed.includes(id))
				.filter((id) => !excluded.includes('snoozed') || !snoozed.includes(id))
				.filter((id) => !isUnreadOnly || (unread[id] ?? 0) > 0)
				.filter((id) => !search || `client ${threadIndex(id)}`.includes(search))
				.sort((a, b) => threadIndex(b) - threadIndex(a));

			const size = Number(params.get('size') ?? 20);
			const start = (Number(params.get('page') ?? 1) - 1) * size;
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					items: matching.slice(start, start + size).map((id) => ({
						id,
						unread_count: unread[id],
					})),
					next: start + size < matching.length,
				}),
			});
		},
	);
	return requests;
}

/** A page of the chat list itself, rather than the snoozed or unread read. */
const isListPage = (params: URLSearchParams) =>
	queryList(params, 'ids').length > 0;

/**
 * Opens the Chats section over the given thread list; the agent has no chat
 * yet. Returns every request the thread list received.
 */
async function openChats(
	page: Page,
	list: Parameters<typeof threadList>[1] = {},
) {
	const requests = await threadList(page, list);
	await page.route('**/api/v1/*/messages**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				items: [],
			}),
		});
	});
	await page.goto('chats');
	await expect(
		page.getByRole('combobox', {
			name: 'Online',
		}),
	).toBeVisible({
		timeout: 30_000,
	});
	return requests;
}

const rows = (page: Page) => page.locator('.chat-preview');
const search = (page: Page) => page.locator('.chat-list-search input');

test.describe('chat list', () => {
	// accepted chats join the list as they come, the newest on top
	test('lists every chat the agent accepts', async ({ page, socket }) => {
		await openChats(page);

		acceptChats(socket, 45);

		await expect(rows(page)).toHaveCount(45);
	});

	test('searches the chats on the backend', async ({ page, socket }) => {
		const requests = await openChats(page);
		acceptChats(socket, 3);
		await expect(rows(page)).toHaveCount(3);

		await search(page).fill('client 2');

		await expect(rows(page)).toHaveCount(1);
		const lastPage = requests.filter(isListPage).at(-1);
		expect(lastPage?.get('q')).toBe('client 2');
		expect(lastPage?.get('page')).toBe('1');
	});

	test('lists every chat again once the search is cleared', async ({
		page,
		socket,
	}) => {
		await openChats(page);
		acceptChats(socket, 3);
		await search(page).fill('client 2');
		await expect(rows(page)).toHaveCount(1);

		await search(page).fill('');

		await expect(rows(page)).toHaveCount(3);
	});

	// AC_02.01.02
	test.describe('paging', () => {
		test('reads the list a page at a time as it is scrolled', async ({
			page,
			socket,
		}) => {
			const requests = await openChats(page);
			acceptChats(socket, 45);
			await expect(rows(page)).toHaveCount(45);

			// a search reads the list again from its first page
			await search(page).fill('client');
			await expect(rows(page)).toHaveCount(20);

			await rows(page).last().scrollIntoViewIfNeeded();
			await expect(rows(page)).toHaveCount(40);
			await rows(page).last().scrollIntoViewIfNeeded();
			await expect(rows(page)).toHaveCount(45);

			const pages = requests
				.filter(isListPage)
				.filter((params) => params.get('q') === 'client');
			expect(pages.map((params) => params.get('page'))).toEqual([
				'1',
				'2',
				'3',
			]);
			// every page is scoped to the agent's chats
			expect(queryList(pages[0], 'ids')).toHaveLength(45);
		});

		// a read without ids would answer the agent's internal chats too
		test('asks for no page while the agent has no chats', async ({ page }) => {
			const requests = await openChats(page);

			await expect(rows(page)).toHaveCount(0);
			expect(requests.filter(isListPage)).toHaveLength(0);
		});

		test('moves a chat with a new message to the top', async ({
			page,
			socket,
		}) => {
			await openChats(page);
			acceptChats(socket, 3);
			await expect(rows(page)).toHaveCount(3);

			// the chat accepted first is at the bottom
			socket.sendChatEvent('message_event', {
				id: 'msg-new',
				thread_id: 'e2e-thread-0',
				seq: '1',
				body: 'Anyone there?',
				created_at: String(Date.now()),
				sender: {
					id: 'm-client',
					contact: {
						name: 'Client 0',
						type: 'telegram',
						sub: 'client-0',
						iss: 'telegram',
					},
				},
			});

			await expect(rows(page).first()).toContainText('Anyone there?');
			await expect(rows(page)).toHaveCount(3);
		});
	});

	test.describe('unread', () => {
		test('shows the unread filter once the unread chats have been read', async ({
			page,
			socket,
		}) => {
			await openChats(page);

			acceptChats(socket, 3);

			await expect(rows(page)).toHaveCount(3);
			await expect(page.locator('.chat-unread-filter')).toBeVisible();
		});

		// "nothing is unread" would be a gap, not a fact
		test('shows no unread filter while that read fails', async ({
			page,
			socket,
		}) => {
			await openChats(page, {
				failUnread: true,
			});

			acceptChats(socket, 3);

			await expect(rows(page)).toHaveCount(3);
			await expect(page.locator('.chat-unread-filter')).toHaveCount(0);
		});

		test('counts the unread messages on the row and the unread chats on the tab', async ({
			page,
			socket,
		}) => {
			await openChats(page, {
				unread: {
					'e2e-thread-1': 3,
					'e2e-thread-2': 1,
				},
			});

			acceptChats(socket, 3);

			// the chat accepted last is on top: 2, 1, 0
			await expect(rows(page)).toHaveCount(3);
			await expect(rows(page).nth(1).locator('.wt-badge')).toHaveText('3');
			await expect(rows(page).nth(2).locator('.wt-badge')).toHaveCount(0);
			await expect(
				page
					.locator('.chat-list-tabs .wt-tab', {
						hasText: 'Active',
					})
					.locator('.wt-badge'),
			).toHaveText([
				'3',
				'2',
			]);
		});

		test('narrows the list to the chats with unread messages', async ({
			page,
			socket,
		}) => {
			const requests = await openChats(page, {
				unread: {
					'e2e-thread-1': 3,
				},
			});
			acceptChats(socket, 3);
			await expect(rows(page)).toHaveCount(3);

			await page.locator('.chat-unread-filter').click();

			await expect(rows(page)).toHaveCount(1);
			expect(requests.filter(isListPage).at(-1)?.get('unread')).toBe('true');

			await page.locator('.chat-unread-filter').click();

			await expect(rows(page)).toHaveCount(3);
		});
	});

	test.describe('tabs', () => {
		const tab = (page: Page, name: string) =>
			page.locator('.chat-list-tabs .wt-tab', {
				hasText: name,
			});

		test('counts the chats on the Active tab', async ({ page, socket }) => {
			await openChats(page);

			acceptChats(socket, 3);

			await expect(page.locator('.chat-preview')).toHaveCount(3);
			await expect(tab(page, 'Active').locator('.wt-badge')).toHaveText('3');
		});

		test('shows no unread count while nothing is unread', async ({
			page,
			socket,
		}) => {
			await openChats(page);

			acceptChats(socket, 3);

			await expect(page.locator('.chat-preview')).toHaveCount(3);
			await expect(tab(page, 'Active').locator('.wt-badge')).toHaveCount(1);
		});

		test('shows an empty Snoozed tab while no chat is snoozed', async ({
			page,
			socket,
		}) => {
			await openChats(page);

			acceptChats(socket, 3);
			await expect(page.locator('.chat-preview')).toHaveCount(3);

			await expect(tab(page, 'Snoozed').locator('.wt-badge')).toHaveText('0');
			await tab(page, 'Snoozed').click();
			await expect(page.locator('.chat-preview')).toHaveCount(0);
		});

		test('lists a snoozed chat on the Snoozed tab only', async ({
			page,
			socket,
		}) => {
			const requests = await openChats(page, {
				snoozed: [
					'e2e-thread-1',
				],
			});

			acceptChats(socket, 3);

			await expect(page.locator('.chat-preview')).toHaveCount(2);
			await expect(tab(page, 'Active').locator('.wt-badge')).toHaveText('2');
			await expect(tab(page, 'Snoozed').locator('.wt-badge')).toHaveText('1');
			await tab(page, 'Snoozed').click();
			await expect(page.locator('.chat-preview')).toHaveCount(1);
			// the Snoozed tab pages on its own (AC_02.02.02)
			expect(
				queryList(
					requests.filter(isListPage).at(-1) as URLSearchParams,
					'tags',
				),
			).toEqual([
				'snoozed',
			]);
		});

		test('moves a chat to Snoozed when it is snoozed', async ({
			page,
			socket,
		}) => {
			await openChats(page);
			acceptChats(socket, 3);
			await expect(page.locator('.chat-preview')).toHaveCount(3);

			socket.sendChatEvent('thread_tags_changed_event', {
				thread_id: 'e2e-thread-0',
				tags: [
					'snoozed',
				],
				updates_cursor: 'c1',
			});

			await expect(page.locator('.chat-preview')).toHaveCount(2);
			await expect(tab(page, 'Snoozed').locator('.wt-badge')).toHaveText('1');
		});

		// any message the agent did not send ends the snooze (AC_02.02.05)
		test('moves a chat back to Active when its snooze ends', async ({
			page,
			socket,
		}) => {
			await openChats(page, {
				snoozed: [
					'e2e-thread-1',
				],
			});
			acceptChats(socket, 3);
			await expect(page.locator('.chat-preview')).toHaveCount(2);

			// an emptied tag list is left out of the frame, as protobuf JSON does
			socket.sendChatEvent('thread_tags_changed_event', {
				thread_id: 'e2e-thread-1',
				updates_cursor: 'c2',
			});

			await expect(page.locator('.chat-preview')).toHaveCount(3);
			await expect(tab(page, 'Snoozed').locator('.wt-badge')).toHaveText('0');
		});

		test('brings the chats back on returning to the Active tab', async ({
			page,
			socket,
		}) => {
			await openChats(page);

			acceptChats(socket, 3);
			await tab(page, 'Snoozed').click();
			await expect(page.locator('.chat-preview')).toHaveCount(0);

			await tab(page, 'Active').click();

			await expect(page.locator('.chat-preview')).toHaveCount(3);
		});
	});
});
