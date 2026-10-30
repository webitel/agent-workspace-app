import type { Page } from '@playwright/test';

import { expect, test } from './fixtures/test';

/**
 * The chat list's Closed tab and the closed chat card it opens: threads the
 * agent has left, read from the chat backend's left-threads endpoints
 * (ADR-0010). The card is read-only and has no call-center task behind it.
 */

const THREAD_ID = 'e2e-left-thread';

const AGENT = {
	id: 'm-agent',
	contact: {
		name: 'Alina Timoshenko',
		type: 'webitel',
		// the id `/userinfo` answers with (see `session`), so the agent's own
		// messages read as outgoing; `iss: 'webitel'` keeps them from being the client
		sub: '1',
		iss: 'webitel',
	},
};
const CLIENT = {
	id: 'm-client',
	contact: {
		name: 'Jane Doe',
		username: '@jane',
		type: 'telegram',
		sub: 'client-1',
		iss: 'telegram',
	},
};

const now = Date.now();

// API answers newest → oldest, snake_case on the wire
const HISTORY = [
	{
		id: 'msg-2',
		seq: '2',
		created_at: String(now - 60_000),
		sender: AGENT,
		body: 'Done, you can log in now.',
	},
	{
		id: 'msg-1',
		seq: '1',
		created_at: String(now - 120_000),
		sender: CLIENT,
		body: 'I cannot log in to my account',
	},
];

/**
 * What the thread keeps for itself. The wire wraps each entry the way the
 * active chat's variables are wrapped (see `mockThreadVariables`).
 */
const THREAD_VARIABLES = {
	Region: 'EU',
};

/** Stubs the left-threads list and the history of the one thread it holds. */
async function mockLeftThreads(
	page: Page,
	{
		threads = [
			leftThread(),
		],
	}: {
		threads?: Record<string, unknown>[];
	} = {},
) {
	const historyRequests: URL[] = [];

	await page.route('**/api/v1/auth/token', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				contact: AGENT.contact,
			}),
		});
	});
	await page.route(
		(url) => url.pathname.endsWith('/api/v1/threads/left'),
		async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					items: threads,
					next: false,
				}),
			});
		},
	);
	await page.route(
		`**/api/v1/threads/${THREAD_ID}/left_threads/messages**`,
		async (route) => {
			historyRequests.push(new URL(route.request().url()));
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					items: HISTORY,
				}),
			});
		},
	);

	return {
		/** every left-thread history request the page has made, in order */
		historyRequests,
	};
}

function leftThread(id = THREAD_ID) {
	return {
		id,
		subject: 'Jane Doe',
		members: [
			AGENT,
			CLIENT,
		],
		variables: {
			thread_id: id,
			variables: Object.fromEntries(
				Object.entries(THREAD_VARIABLES).map(([key, value]) => [
					key,
					{
						value: {
							value,
						},
					},
				]),
			),
		},
	};
}

/** Waits out app bootstrap: the window shows a loader until the agent session exists. */
async function waitForAgentSession(page: Page) {
	await expect(
		page.getByRole('combobox', {
			name: 'Online',
		}),
	).toBeVisible({
		timeout: 30_000,
	});
}

/** The listed chats, not the placeholder row an empty table shows. */
const chatRows = (page: Page) =>
	page.locator('.chats-closed-table tbody tr:not(.p-datatable-empty-message)');

async function openClosedTab(page: Page) {
	await page.goto('chats/closed');
	await waitForAgentSession(page);
}

async function openClosedChat(page: Page) {
	await openClosedTab(page);
	await chatRows(page).locator('.wt-icon-btn').click();
	await expect(page.locator('.closed-chat-top-bar')).toBeVisible();
}

const windowTabs = (page: Page) =>
	page.locator('.the-chat-window .wt-tabs .wt-tab');

const windowTab = (page: Page, name: string) =>
	page.locator('.the-chat-window .wt-tabs').getByRole('button', {
		name,
		exact: true,
	});

/** The text of the cell under `header` in the table's first row. */
async function cellUnder(page: Page, header: string) {
	const headers = await page
		.locator('.chats-closed-table thead th')
		.allInnerTexts();
	const column = headers.findIndex((text) => text.trim() === header);
	expect(column, `no "${header}" column`).toBeGreaterThanOrEqual(0);
	return chatRows(page).first().locator('td').nth(column);
}

test.describe('closed chats', () => {
	test.beforeEach(() => {
		test.setTimeout(60_000);
	});

	test.describe('Closed tab', () => {
		test('lists a left chat by its client, leaving what the backend does not return empty', async ({
			page,
		}) => {
			await mockLeftThreads(page);

			await openClosedTab(page);

			await expect(chatRows(page)).toHaveCount(1);
			await expect(await cellUnder(page, 'Name')).toHaveText('Jane Doe');
			await expect(await cellUnder(page, 'Username')).toHaveText('@jane');
			for (const header of [
				'Queue',
				'Started at',
				'Ended at',
				'Duration',
				'Message',
			]) {
				await expect(await cellUnder(page, header), header).toHaveText('');
			}
		});

		test('has no search field, as the left threads cannot be searched', async ({
			page,
		}) => {
			await mockLeftThreads(page);
			const actionPanel = page.locator(
				'.chats-panel-wrapper .table-action-panel',
			);

			// the Active tab has one, which is what the Closed tab is compared to
			await page.goto('chats');
			await waitForAgentSession(page);
			await expect(actionPanel).toHaveCount(1);

			await page
				.locator('.chats-panel-wrapper__header .wt-tab', {
					hasText: 'Closed',
				})
				.click();

			await expect(chatRows(page)).toHaveCount(1);
			await expect(actionPanel).toHaveCount(0);
		});

		test('lists nothing while the agent has left no chat', async ({ page }) => {
			await mockLeftThreads(page, {
				threads: [],
			});

			await openClosedTab(page);

			await expect(chatRows(page)).toHaveCount(0);
		});
	});

	test.describe('closed chat card', () => {
		test('opens read-only, on the client, with no queue, Reopen or composer', async ({
			page,
		}) => {
			await mockLeftThreads(page);

			await openClosedChat(page);

			const topBar = page.locator('.closed-chat-top-bar');
			// the lock is the only icon ahead of the avatar
			await expect(
				topBar.locator('.task-top-bar__identity > .wt-icon'),
			).toHaveCount(1);
			await expect(topBar.locator('.task-top-bar__name')).toHaveText('@jane');
			await expect(topBar.locator('.task-top-bar__subtitle')).toHaveCount(0);
			await expect(
				page.getByRole('button', {
					name: 'Reopen',
				}),
			).toHaveCount(0);
			await expect(page.locator('.chat-composer')).toHaveCount(0);
		});

		test("shows the thread's history, read from the left thread", async ({
			page,
		}) => {
			const { historyRequests } = await mockLeftThreads(page);

			await openClosedChat(page);

			await expect(page.locator('.chat-message')).toHaveCount(2);
			await expect(page.locator('.chat-history')).toContainText(
				'I cannot log in to my account',
			);
			await expect(page.locator('.chat-history')).toContainText(
				'Done, you can log in now.',
			);
			// the agent's own message is told from the client's
			await expect(page.locator('.chat-message--outgoing')).toHaveCount(1);
			expect(historyRequests).toHaveLength(1);
		});

		test('keeps Post-processing in the strip but not selectable', async ({
			page,
		}) => {
			await mockLeftThreads(page);

			await openClosedChat(page);

			await expect(windowTabs(page)).toHaveText([
				'Chat',
				'Info',
				'Post-processing',
				'Interaction',
				'Contact',
				'Iframe',
			]);
			await expect(
				page.locator('.the-chat-window [aria-disabled="true"]'),
			).toHaveCount(4);

			// the button still takes the click; the window just ignores it
			await windowTab(page, 'Post-processing').click();
			await expect(windowTab(page, 'Chat')).toHaveClass(/wt-tab--highlight/);
			await expect(page.locator('.chat-history')).toBeVisible();
		});

		test("shows the thread's variables and says the call-center ones are missing", async ({
			page,
		}) => {
			await mockLeftThreads(page);
			// the Info tab must not go looking for what a former member cannot read
			const variablesRequests: string[] = [];
			await page.route(
				`**/api/v1/threads/${THREAD_ID}/variables`,
				async (route) => {
					variablesRequests.push(route.request().url());
					await route.fulfill({
						status: 403,
						contentType: 'application/json',
						body: '{}',
					});
				},
			);
			await openClosedChat(page);

			await windowTab(page, 'Info').click();

			await expect(page.locator('.chat-info')).toBeVisible();
			await expect(page.locator('.chat-info .chat-info__notice')).toContainText(
				'Contact center variables are not available for closed chats',
			);
			await expect(page.locator('.chat-info tbody tr')).toHaveCount(1);
			await expect(page.locator('.chat-info tbody tr')).toContainText('Region');
			await expect(page.locator('.chat-info tbody tr')).toContainText('EU');
			expect(variablesRequests).toHaveLength(0);
		});
	});
});
