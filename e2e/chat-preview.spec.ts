import type { Page } from '@playwright/test';

import {
	chatDistribute,
	chatTaskFrame,
	type MockedSocket,
	mockChatThread,
} from './fixtures/mocks';
import { expect, test } from './fixtures/test';

/**
 * The chat list's preview row (US_02.03): who the client is, the last message,
 * the queue, and which row is selected.
 */

const THREAD = {
	id: 'e2e-thread-1',
	subject: 'Jane Doe',
};
const ATTEMPT_ID = 101;

/** Puts a bridged chat task in the feed; the list shows it as a preview. */
async function acceptChat(page: Page, socket: MockedSocket) {
	await mockChatThread(page, THREAD);
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
		await expect(preview.locator('.chat-preview-body__text')).toHaveText(
			'Hi, I need help',
		);
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
});
