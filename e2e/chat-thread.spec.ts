import type { Page } from '@playwright/test';

import {
	chatDistribute,
	chatTaskFrame,
	type MockedSocket,
} from './fixtures/mocks';
import { expect, test } from './fixtures/test';

/**
 * The active chat's Chat tab (AC_03.02.01–05) rendered by @webitel/ui-chats/v2:
 * history with dividers, system notices and delivery ticks, and the composer.
 */

const THREAD_ID = 'e2e-thread-chat';
const ATTEMPT_ID = 102;

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

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

// API answers newest → oldest, snake_case on the wire
const HISTORY = [
	{
		id: 'msg-3',
		seq: '3',
		created_at: String(now - 60_000),
		sender: AGENT,
		body: 'Hi! Let’s check this together.',
	},
	{
		id: 'msg-2',
		seq: '2',
		created_at: String(now - 120_000),
		sender: AGENT,
		system: {
			type: 'transferred',
		},
	},
	{
		id: 'msg-1',
		seq: '1',
		created_at: String(now - 3 * DAY),
		sender: CLIENT,
		body: 'Can we try resetting the password?',
	},
];

async function mockThread(
	page: Page,
	{
		sendStatus = 200,
	}: {
		sendStatus?: number;
	} = {},
) {
	await page.route('**/api/v1/auth/token', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				contact: AGENT.contact,
			}),
		});
	});
	await page.route(`**/api/v1/threads/${THREAD_ID}`, async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				id: THREAD_ID,
				subject: 'Jane Doe',
				members: [
					AGENT,
					CLIENT,
				],
				read_states: [
					{
						member_id: CLIENT.id,
						delivered_up_to_seq: '3',
						read_up_to_seq: '3',
					},
				],
			}),
		});
	});
	await page.route(`**/api/v1/${THREAD_ID}/messages**`, async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				items: HISTORY,
			}),
		});
	});
	await page.route('**/api/v1/messages/text', async (route) => {
		await route.fulfill({
			status: sendStatus,
			contentType: 'application/json',
			body: JSON.stringify(
				sendStatus === 200
					? {
							id: 'msg-sent',
						}
					: {
							message: 'failed',
						},
			),
		});
	});
}

async function openChat(page: Page, socket: MockedSocket) {
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
				threadId: THREAD_ID,
				subject: 'Jane Doe',
			}),
		}),
	);
	socket.send(
		'channel',
		chatTaskFrame('bridged', {
			attemptId: ATTEMPT_ID,
		}),
	);

	await page.locator('.chat-preview__open').first().click();
	await expect(page.locator('.chat-history')).toBeVisible();
}

const composerField = (page: Page) => page.locator('.chat-composer textarea');

test.describe('chat thread', () => {
	test.beforeEach(() => {
		test.setTimeout(60_000);
	});

	test('renders the history with day dividers, a system notice and ticks', async ({
		page,
		socket,
	}) => {
		await mockThread(page);
		await openChat(page, socket);

		await expect(page.locator('.chat-message')).toHaveCount(2);
		await expect(page.locator('.chat-date-divider')).toHaveCount(2);
		await expect(page.locator('.chat-date-divider').last()).toHaveText('Today');
		await expect(page.locator('.chat-system-notice')).toContainText(
			'Alina Timoshenko transferred the chat',
		);

		const own = page.locator('.chat-message--outgoing');
		await expect(own).toHaveCount(1);
		await expect(own.locator('.message-status--read')).toBeVisible();
		await expect(
			page.locator(
				'.chat-message:not(.chat-message--outgoing) .message-status',
			),
		).toHaveCount(0);
	});

	test('clears the field once a message is sent', async ({ page, socket }) => {
		await mockThread(page);
		await openChat(page, socket);

		await composerField(page).fill('Thanks, it worked');
		await composerField(page).press('Enter');

		await expect(composerField(page)).toHaveValue('');
	});

	test('keeps the text when sending fails', async ({ page, socket }) => {
		await mockThread(page, {
			sendStatus: 500,
		});
		await openChat(page, socket);

		await composerField(page).fill('Will this go through?');
		await composerField(page).press('Enter');

		await expect(composerField(page)).toBeEnabled();
		await expect(composerField(page)).toHaveValue('Will this go through?');
	});
});
