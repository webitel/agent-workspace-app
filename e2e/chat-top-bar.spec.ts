import type { Page } from '@playwright/test';

import {
	chatDistribute,
	chatTaskFrame,
	type MockedSocket,
	mockChatThread,
	session,
} from './fixtures/mocks';
import { expect, test } from './fixtures/test';

/**
 * The active chat's top bar: what it shows, ending the chat by leaving its
 * thread (ADR-0005), and the swap to the post-processing timer once the task
 * moves on.
 */

const THREAD = {
	id: 'e2e-thread-1',
	subject: 'Jane Doe',
};
const ATTEMPT_ID = 101;
const AGENT_MEMBER_ID = 'e2e-agent-member';

const members = [
	{
		id: 'e2e-client-member',
		contact: {
			sub: 'telegram-77',
		},
	},
	{
		id: AGENT_MEMBER_ID,
		contact: {
			// the logged-in user; see ADR-0005
			sub: String(session.userId),
		},
	},
];

/** Puts a bridged chat task in the feed and opens its window. */
async function openActiveChat(
	page: Page,
	socket: MockedSocket,
	{
		threadMembers = members,
	}: {
		threadMembers?: object[];
	} = {},
) {
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
				members: threadMembers,
			}),
		}),
	);
	socket.send(
		'channel',
		chatTaskFrame('bridged', {
			attemptId: ATTEMPT_ID,
		}),
	);

	await page.locator('.chat-preview__open').click();
	await expect(page.locator('.chat-top-bar')).toBeVisible();
}

function startPostProcessing(socket: MockedSocket, timeoutInSec: number) {
	socket.send(
		'channel',
		chatTaskFrame('processing', {
			attemptId: ATTEMPT_ID,
			processing: {
				sec: 60,
				timeout: Date.now() + timeoutInSec * 1000,
				renewal_sec: 10,
				processing_prolongation: {
					remaining_prolongations: 2,
					prolongation_sec: 30,
				},
			},
		}),
	);
}

// wt-popup renders an <aside>, with no dialog role to query by
const dialog = (page: Page) => page.locator('.wt-popup');

const endButton = (page: Page) =>
	page.locator('.chat-end-action').getByRole('button');

test.describe('chat top bar', () => {
	test.beforeEach(() => {
		test.setTimeout(60_000);
	});

	test('shows the client and the queue the chat came from', async ({
		page,
		socket,
	}) => {
		await openActiveChat(page, socket);

		const bar = page.locator('.chat-top-bar');
		await expect(bar).toContainText('@jane');
		await expect(bar).toContainText('Chat support');
	});

	test('keeps transfer in place but disabled', async ({ page, socket }) => {
		await openActiveChat(page, socket);

		// wt-icon-btn disables through a class, not the `disabled` attribute
		await expect(
			page.getByRole('button', {
				name: 'Transfer chat',
			}),
		).toHaveClass(/wt-icon-btn--disabled/);
	});

	test('ends the chat by leaving its thread, once confirmed', async ({
		page,
		socket,
	}) => {
		const removals: string[] = [];
		await page.route(
			`**/api/v1/threads/${THREAD.id}/members/*`,
			async (route) => {
				removals.push(`${route.request().method()} ${route.request().url()}`);
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: '{}',
				});
			},
		);
		await openActiveChat(page, socket);

		await endButton(page).click();
		// asking first: nothing is sent until the agent agrees
		expect(removals).toHaveLength(0);
		await dialog(page)
			.getByRole('button', {
				name: 'End chat',
			})
			.click();

		await expect.poll(() => removals).toHaveLength(1);
		expect(removals[0]).toMatch(
			new RegExp(`^DELETE .*/members/${AGENT_MEMBER_ID}$`),
		);
	});

	test('does not end the chat when the confirmation is cancelled', async ({
		page,
		socket,
	}) => {
		const removals: string[] = [];
		await page.route(
			`**/api/v1/threads/${THREAD.id}/members/*`,
			async (route) => {
				removals.push(route.request().url());
				await route.fulfill({
					status: 200,
					body: '{}',
				});
			},
		);
		await openActiveChat(page, socket);

		await endButton(page).click();
		await dialog(page)
			.getByRole('button', {
				name: 'Cancel',
			})
			.click();

		await expect(dialog(page)).toHaveCount(0);
		expect(removals).toHaveLength(0);
	});

	test('disables ending when the agent is not a member of the thread', async ({
		page,
		socket,
	}) => {
		await openActiveChat(page, socket, {
			threadMembers: [
				members[0],
			],
		});

		await expect(endButton(page)).toBeDisabled();
	});

	test('swaps ending for the countdown once post-processing starts', async ({
		page,
		socket,
	}) => {
		await openActiveChat(page, socket);
		await expect(endButton(page)).toBeVisible();

		startPostProcessing(socket, 59);

		const timer = page.locator('.chat-top-bar-timer');
		await expect(timer).toContainText(/00:[0-5]\d/);
		await expect(page.locator('.chat-end-action')).toHaveCount(0);
		await expect(timer.locator('.chat-top-bar-timer__time')).toHaveClass(
			/--success/,
		);
	});

	test('turns the countdown red and opens renewal near the deadline', async ({
		page,
		socket,
	}) => {
		await openActiveChat(page, socket);

		// 6s of 60s left: under a third, and inside the 10s renewal window
		startPostProcessing(socket, 6);

		const time = page.locator('.chat-top-bar-timer__time');
		await expect(time).toHaveClass(/--error/);

		await page
			.locator('.chat-top-bar-timer')
			.getByRole('button', {
				name: 'Extend post-processing',
			})
			.click();

		await expect
			.poll(() =>
				socket.requests.find((request) => request.action === 'cc_renewal'),
			)
			.toMatchObject({
				data: {
					attempt_id: ATTEMPT_ID,
					renewal_sec: 30,
				},
			});
	});
});
