import type { Page } from '@playwright/test';

import {
	chatDistribute,
	chatTaskFrame,
	type MockedSocket,
} from './fixtures/mocks';
import { expect, test } from './fixtures/test';

/**
 * The chat list is a window that grows on scroll (US_02.01, AC_02.01.02): it
 * costs one history request per chat shown, so an agent with many chats must
 * not open the page to one request for each.
 */

const PAGE_SIZE = 20;
const CHAT_COUNT = 45;
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

async function openChatsWithHistoryCount(page: Page) {
	let historyRequests = 0;
	await page.route('**/api/v1/*/messages**', async (route) => {
		historyRequests += 1;
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
	return () => historyRequests;
}

test.describe('chat list window', () => {
	test('shows a page of chats and loads the rest on scroll', async ({
		page,
		socket,
	}) => {
		const historyRequests = await openChatsWithHistoryCount(page);
		acceptChats(socket, CHAT_COUNT);
		const rows = page.locator('.chat-preview');

		await expect(rows).toHaveCount(PAGE_SIZE);

		await rows.last().scrollIntoViewIfNeeded();
		await expect(rows).toHaveCount(PAGE_SIZE * 2);

		await rows.last().scrollIntoViewIfNeeded();
		await expect(rows).toHaveCount(CHAT_COUNT);
		await expect(page.locator('.the-chat-previews-list__sentinel')).toHaveCount(
			0,
		);

		// every chat in the window was read once, none of the others were
		expect(historyRequests()).toBe(CHAT_COUNT);
	});

	test('reads the history of the visible chats only', async ({
		page,
		socket,
	}) => {
		const historyRequests = await openChatsWithHistoryCount(page);
		acceptChats(socket, CHAT_COUNT);

		await expect(page.locator('.chat-preview')).toHaveCount(PAGE_SIZE);

		expect(historyRequests()).toBe(PAGE_SIZE);
	});

	test('shows no unread filter while there is no unread data', async ({
		page,
		socket,
	}) => {
		await openChatsWithHistoryCount(page);
		acceptChats(socket, 3);

		await expect(page.locator('.chat-preview')).toHaveCount(3);
		await expect(page.locator('.chat-unread-filter')).toHaveCount(0);
	});
});
