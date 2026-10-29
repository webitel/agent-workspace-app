import type { Page } from '@playwright/test';

import {
	chatDistribute,
	chatTaskFrame,
	type MockedSocket,
} from './fixtures/mocks';
import { expect, test } from './fixtures/test';

/**
 * The chat list's Active tab (US_02.01): the chats the agent has accepted, in a
 * window that grows on scroll and searchable by the client's name, and the
 * unread control, which has to stay out of sight until the backend says how
 * many unread messages a chat has. Also its tab indicators (US_02.12) and the
 * Snoozed tab (US_02.02), fed by the chat backend's snoozed threads (ADR-0008).
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

/** The chat backend says these threads are snoozed. */
async function snoozeThreads(page: Page, threadIds: string[]) {
	await page.route(
		(url) =>
			url.pathname.endsWith('/api/v1/threads') &&
			url.searchParams.get('tags') === 'snoozed',
		async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					items: threadIds.map((id) => ({
						id,
					})),
					next: false,
				}),
			});
		},
	);
}

async function openChats(page: Page) {
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
}

const rows = (page: Page) => page.locator('.chat-preview');

test.describe('chat list', () => {
	// the task feed arrives whole; the window is what bounds the work per chat
	test('shows a page of chats and loads the rest on scroll', async ({
		page,
		socket,
	}) => {
		await openChats(page);

		acceptChats(socket, 45);

		await expect(rows(page)).toHaveCount(20);

		await rows(page).last().scrollIntoViewIfNeeded();
		await expect(rows(page)).toHaveCount(40);

		await rows(page).last().scrollIntoViewIfNeeded();
		await expect(rows(page)).toHaveCount(45);
		await expect(page.locator('.the-chat-previews-list__sentinel')).toHaveCount(
			0,
		);
	});

	// one history read per shown chat, which is what the window is for
	test('reads the last message of the shown chats only', async ({
		page,
		socket,
	}) => {
		const histories: string[] = [];
		await page.route('**/api/v1/*/messages**', async (route) => {
			histories.push(route.request().url());
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

		acceptChats(socket, 45);
		await expect(rows(page)).toHaveCount(20);

		// the 21st chat has not been scrolled to, so its history is not read
		await expect.poll(() => histories.length).toBe(20);
		expect(histories.some((url) => url.includes('e2e-thread-30'))).toBe(false);
	});

	test('searches the chats by the client’s name', async ({ page, socket }) => {
		await openChats(page);
		acceptChats(socket, 3);
		await expect(rows(page)).toHaveCount(3);

		await page.locator('.chat-list-search input').fill('client 2');

		await expect(rows(page)).toHaveCount(1);
	});

	test('lists every chat again once the search is cleared', async ({
		page,
		socket,
	}) => {
		await openChats(page);
		acceptChats(socket, 3);
		await page.locator('.chat-list-search input').fill('client 2');
		await expect(rows(page)).toHaveCount(1);

		await page.locator('.chat-list-search input').fill('');

		await expect(rows(page)).toHaveCount(3);
	});

	test('shows no unread filter while there is no unread data', async ({
		page,
		socket,
	}) => {
		await openChats(page);

		acceptChats(socket, 3);

		await expect(rows(page)).toHaveCount(3);
		await expect(page.locator('.chat-unread-filter')).toHaveCount(0);
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

		test('shows no unread count while there is no unread data', async ({
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
			await snoozeThreads(page, [
				'e2e-thread-1',
			]);
			await openChats(page);

			acceptChats(socket, 3);

			await expect(page.locator('.chat-preview')).toHaveCount(2);
			await expect(tab(page, 'Active').locator('.wt-badge')).toHaveText('2');
			await expect(tab(page, 'Snoozed').locator('.wt-badge')).toHaveText('1');
			await tab(page, 'Snoozed').click();
			await expect(page.locator('.chat-preview')).toHaveCount(1);
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
			await snoozeThreads(page, [
				'e2e-thread-1',
			]);
			await openChats(page);
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
