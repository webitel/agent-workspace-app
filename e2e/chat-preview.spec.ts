import type { Page } from '@playwright/test';

import {
	chatDistribute,
	chatTaskFrame,
	type MockedSocket,
	mockChatThread,
} from './fixtures/mocks';
import { expect, test } from './fixtures/test';

/**
 * The chat list's preview row (US_02.03): who the client is, the last message
 * with its time and author, the queue, and which row is selected.
 */

const THREAD = {
	id: 'e2e-thread-1',
	subject: 'Jane Doe',
};
const ATTEMPT_ID = 101;

const AGENT = {
	id: 'm-agent',
	contact: {
		name: 'Alina Timoshenko',
		type: 'webitel',
		sub: '42',
		iss: 'webitel',
	},
};
const CLIENT = {
	id: 'm-client',
	contact: {
		name: 'Jane Doe',
		type: 'telegram',
		sub: 'client-1',
		iss: 'telegram',
	},
};

type Message = Record<string, unknown>;

/** A clock time today, so the row shows `HH:mm` whatever day the suite runs. */
const todayAt = (hour: number, minute: number) =>
	new Date().setHours(hour, minute, 0, 0);
const clock = (hour: number, minute: number) =>
	`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

/** A message the way the backend writes it, snake_case. */
const message = (
	id: string,
	sender: typeof AGENT | typeof CLIENT,
	body: string,
	at: number,
): Message => ({
	id,
	thread_id: THREAD.id,
	seq: id.replace(/\D/g, ''),
	created_at: String(at),
	sender,
	body,
});

/**
 * Puts a bridged chat task in the feed; the list shows it as a preview.
 * `messages` is the thread's history, newest first. The agent's account and the
 * thread's members are what let the row tell the agent's messages from the
 * client's.
 */
async function acceptChat(
	page: Page,
	socket: MockedSocket,
	{
		messages = [],
	}: {
		messages?: Message[];
	} = {},
) {
	await mockChatThread(page, {
		...THREAD,
		messages,
	});
	await page.route('**/api/v1/auth/token', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				contact: AGENT.contact,
			}),
		});
	});
	await page.goto('chats');

	// the SDK drops `channel` frames until the agent session exists
	await expect(
		page.getByRole('combobox', {
			name: 'Online',
		}),
	).toBeVisible({
		timeout: 30_000,
	});

	socket.send(
		'channel',
		chatTaskFrame('distribute', {
			attemptId: ATTEMPT_ID,
			distribute: chatDistribute({
				threadId: THREAD.id,
				subject: THREAD.subject,
				members: [
					AGENT,
					CLIENT,
				],
			}),
		}),
	);
	socket.send(
		'channel',
		chatTaskFrame('bridged', {
			attemptId: ATTEMPT_ID,
		}),
	);
}

const lastMessage = (page: Page) => page.locator('.chat-preview-body');
const lastMessageText = (page: Page) =>
	page.locator('.chat-preview-body__text');
const sentAt = (page: Page) => page.locator('.chat-preview__time');

test.describe('chat preview', () => {
	test('shows the client, the last message and the queue', async ({
		page,
		socket,
	}) => {
		await acceptChat(page, socket);

		const preview = page.locator('.chat-preview');
		await expect(preview).toBeVisible();
		await expect(preview.locator('.client-identity-block__name')).toHaveText(
			'@jane',
		);
		await expect(lastMessageText(page)).toHaveText('Hi, I need help');
		await expect(preview.locator('.chat-preview-footer')).toContainText(
			'Chat support',
		);
	});

	test('marks the chat open in the central panel as selected', async ({
		page,
		socket,
	}) => {
		await acceptChat(page, socket);
		const preview = page.locator('.chat-preview');
		await expect(preview).not.toHaveClass(/chat-preview--selected/);

		await preview.click();

		await expect(page.locator('.chat-top-bar')).toBeVisible();
		await expect(preview).toHaveClass(/chat-preview--selected/);
	});

	test.describe('last message', () => {
		test('shows when the client wrote it', async ({ page, socket }) => {
			await acceptChat(page, socket, {
				messages: [
					message('msg-1', CLIENT, 'Can you help me?', todayAt(9, 5)),
				],
			});

			await expect(lastMessageText(page)).toHaveText('Can you help me?');
			await expect(sentAt(page)).toHaveText(clock(9, 5));
			await expect(lastMessage(page)).toHaveClass(/chat-preview-body--client/);
		});

		test("shows the agent's own reply in the agent look", async ({
			page,
			socket,
		}) => {
			await acceptChat(page, socket, {
				messages: [
					message('msg-2', AGENT, 'On it', todayAt(9, 6)),
					message('msg-1', CLIENT, 'Can you help me?', todayAt(9, 5)),
				],
			});

			await expect(lastMessageText(page)).toHaveText('On it');
			await expect(sentAt(page)).toHaveText(clock(9, 6));
			await expect(lastMessage(page)).toHaveClass(/chat-preview-body--agent/);
		});

		test('follows a new message arriving over the chat socket', async ({
			page,
			socket,
		}) => {
			await acceptChat(page, socket, {
				messages: [
					message('msg-1', CLIENT, 'Can you help me?', todayAt(9, 5)),
				],
			});
			await expect(lastMessage(page)).toHaveClass(/chat-preview-body--client/);

			socket.sendChatEvent(
				'message_event',
				message('msg-2', AGENT, 'Sure, one moment', todayAt(9, 7)),
			);

			await expect(lastMessageText(page)).toHaveText('Sure, one moment');
			await expect(sentAt(page)).toHaveText(clock(9, 7));
			await expect(lastMessage(page)).toHaveClass(/chat-preview-body--agent/);
		});
	});
});
