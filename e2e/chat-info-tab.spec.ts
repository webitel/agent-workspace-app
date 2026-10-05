import type { Page } from '@playwright/test';

import {
	chatDistribute,
	chatTaskFrame,
	type MockedSocket,
	mockChatThread,
	mockThreadVariables,
} from './fixtures/mocks';
import { expect, test } from './fixtures/test';

/**
 * The active chat's Info tab (AC_03.02.06): the variables of the call-center
 * task and of the chat thread as one Key/Value table.
 */

const THREAD = {
	id: 'e2e-thread-1',
	subject: 'Jane Doe',
};
const ATTEMPT_ID = 101;

/** Puts a bridged chat in the feed, opens its window and returns the thread stub. */
async function openActiveChat(
	page: Page,
	socket: MockedSocket,
	{
		taskVariables = {},
		threadVariables = {},
	}: {
		taskVariables?: Record<string, string>;
		threadVariables?: Record<string, unknown>;
	} = {},
) {
	await mockChatThread(page, THREAD);
	const variables = await mockThreadVariables(page, THREAD.id, threadVariables);
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
				variables: taskVariables,
			}),
		}),
	);
	socket.send(
		'channel',
		chatTaskFrame('bridged', {
			attemptId: ATTEMPT_ID,
		}),
	);

	await page.locator('.chat-preview').click();
	await expect(page.locator('.chat-top-bar')).toBeVisible();

	return variables;
}

const tab = (page: Page, name: string) =>
	page.locator('.wt-tabs').getByRole('button', {
		name,
		exact: true,
	});

const openInfo = async (page: Page) => {
	await tab(page, 'Info').click();
	await expect(page.locator('.chat-info')).toBeVisible();
};

const infoRows = (page: Page) => page.locator('.chat-info tbody tr');

/** Rendered rows as "key=value", in table order. */
const rowTexts = async (page: Page) =>
	(await infoRows(page).allInnerTexts()).map((text) =>
		text.split(/\s*\t\s*/).join('='),
	);

const header = (page: Page, name: string) =>
	page.locator('.chat-info thead th', {
		hasText: name,
	});

test.describe('chat info tab', () => {
	test.beforeEach(() => {
		test.setTimeout(60_000);
	});

	test('lists the task variables, then the thread variables', async ({
		page,
		socket,
	}) => {
		await openActiveChat(page, socket, {
			taskVariables: {
				CustomerID: '458732',
			},
			threadVariables: {
				Region: 'EU',
			},
		});

		await openInfo(page);

		await expect
			.poll(() => rowTexts(page))
			.toEqual([
				'CustomerID=458732',
				'Region=EU',
			]);
	});

	test('shows both rows when a key comes from both sources', async ({
		page,
		socket,
	}) => {
		await openActiveChat(page, socket, {
			taskVariables: {
				Language: 'EN',
			},
			threadVariables: {
				Language: 'UK',
			},
		});

		await openInfo(page);

		await expect
			.poll(() => rowTexts(page))
			.toEqual([
				'Language=EN',
				'Language=UK',
			]);
	});

	test('renders structured values as JSON, in full', async ({
		page,
		socket,
	}) => {
		const longValue = 'x'.repeat(300);
		await openActiveChat(page, socket, {
			threadVariables: {
				Plan: {
					tier: 'gold',
				},
				Note: longValue,
			},
		});

		await openInfo(page);

		await expect(infoRows(page).first()).toContainText('{"tier":"gold"}');
		await expect(infoRows(page).nth(1)).toContainText(longValue);
	});

	test('says so when the chat has no variables', async ({ page, socket }) => {
		await openActiveChat(page, socket);

		await openInfo(page);

		const empty = page.locator('.chat-info .wt-empty');
		await expect(empty).toContainText('No variables');
		// the illustration, not just the line of text
		await expect(empty.locator('img')).toBeVisible();
		await expect(infoRows(page)).toHaveCount(0);
	});

	test('reads the thread variables again each time the tab is opened', async ({
		page,
		socket,
	}) => {
		const variables = await openActiveChat(page, socket, {
			threadVariables: {
				Stage: 'new',
			},
		});
		await openInfo(page);
		await expect
			.poll(() => rowTexts(page))
			.toEqual([
				'Stage=new',
			]);

		// a bot moves the chat along while the agent is on the Chat tab
		variables.set({
			Stage: 'escalated',
		});
		await tab(page, 'Chat').click();
		await openInfo(page);

		await expect
			.poll(() => rowTexts(page))
			.toEqual([
				'Stage=escalated',
			]);
		expect(variables.requests).toHaveLength(2);
	});

	test('cycles a column through ascending, descending and back to source order', async ({
		page,
		socket,
	}) => {
		await openActiveChat(page, socket, {
			taskVariables: {
				'ticket-2': 'a',
				'ticket-10': 'c',
			},
			threadVariables: {
				Beta: 'b',
			},
		});
		await openInfo(page);
		await expect(infoRows(page)).toHaveCount(3);

		await header(page, 'Key').click();
		await expect
			.poll(() => rowTexts(page))
			.toEqual([
				'Beta=b',
				'ticket-2=a',
				'ticket-10=c',
			]);

		await header(page, 'Key').click();
		await expect
			.poll(() => rowTexts(page))
			.toEqual([
				'ticket-10=c',
				'ticket-2=a',
				'Beta=b',
			]);

		await header(page, 'Key').click();
		await expect
			.poll(() => rowTexts(page))
			.toEqual([
				'ticket-2=a',
				'ticket-10=c',
				'Beta=b',
			]);
	});

	test('shows an error and retries on demand, without dropping what it had', async ({
		page,
		socket,
	}) => {
		const variables = await openActiveChat(page, socket, {
			taskVariables: {
				CustomerID: '458732',
			},
		});
		variables.fail(500);

		await openInfo(page);

		await expect(page.locator('.chat-info .p-message')).toContainText(
			"Couldn't load the variables",
		);
		await expect(infoRows(page)).toHaveCount(1);

		variables.set({
			Region: 'EU',
		});
		await page
			.locator('.chat-info')
			.getByRole('button', {
				name: 'Retry',
			})
			.click();

		await expect(page.locator('.chat-info .p-message')).toHaveCount(0);
		await expect
			.poll(() => rowTexts(page))
			.toEqual([
				'CustomerID=458732',
				'Region=EU',
			]);
	});

	for (const status of [
		403,
		404,
	]) {
		test(`falls back to the task's variables when the thread answers ${status}`, async ({
			page,
			socket,
		}) => {
			const variables = await openActiveChat(page, socket, {
				taskVariables: {
					CustomerID: '458732',
				},
			});
			variables.fail(status);

			await openInfo(page);

			await expect
				.poll(() => rowTexts(page))
				.toEqual([
					'CustomerID=458732',
				]);
			await expect(page.locator('.chat-info .p-message')).toHaveCount(0);
		});
	}

	test('draws the sort arrow on the sorted column only', async ({
		page,
		socket,
	}) => {
		await openActiveChat(page, socket, {
			taskVariables: {
				CustomerID: '458732',
			},
		});
		await openInfo(page);
		const arrowIn = (name: string) =>
			header(page, name).locator('.wt-table__th__sort-arrow');

		await expect(arrowIn('Key')).toHaveCount(0);
		await expect(arrowIn('Value')).toHaveCount(0);

		await header(page, 'Key').click();
		await expect(arrowIn('Key')).toHaveCount(1);
		await expect(arrowIn('Value')).toHaveCount(0);

		// sorting by the other column moves the arrow rather than adding a second
		await header(page, 'Value').click();
		await expect(arrowIn('Value')).toHaveCount(1);
		await expect(arrowIn('Key')).toHaveCount(0);
	});

	for (const theme of [
		'light',
		'dark',
	]) {
		test(`paints the table from theme tokens in the ${theme} theme`, async ({
			page,
			socket,
		}) => {
			await page.addInitScript((value) => {
				localStorage.setItem('theme', value);
				document.documentElement.classList.toggle(
					'theme--dark',
					value === 'dark',
				);
			}, theme);
			await openActiveChat(page, socket, {
				taskVariables: {
					CustomerID: '458732',
				},
			});
			await openInfo(page);

			const keyCell = page
				.locator('.chat-info tbody tr td:nth-child(1) .variables-table__cell')
				.first();
			const valueCell = page
				.locator('.chat-info tbody tr td:nth-child(2) .variables-table__cell')
				.first();

			// keys read heavier than values (DES-730) ...
			const weightOf = async (cell: typeof keyCell) =>
				Number(
					await cell.evaluate(
						(element) => getComputedStyle(element).fontWeight,
					),
				);
			expect(await weightOf(keyCell)).toBeGreaterThan(
				await weightOf(valueCell),
			);

			// ... and neither overrides the colour the theme gives the table's cells
			const cellColor = await keyCell
				.locator('xpath=ancestor::td')
				.evaluate((element) => getComputedStyle(element).color);
			await expect(keyCell).toHaveCSS('color', cellColor);
			await expect(valueCell).toHaveCSS('color', cellColor);
		});
	}

	test('keeps Interaction, Contact and Iframe in the strip but not selectable', async ({
		page,
		socket,
	}) => {
		await openActiveChat(page, socket);

		await expect(page.locator('.wt-tabs .wt-tab')).toHaveText([
			'Chat',
			'Info',
			'Interaction',
			'Contact',
			'Iframe',
		]);
		await expect(page.locator('.wt-tabs [aria-disabled="true"]')).toHaveCount(
			3,
		);

		for (const name of [
			'Interaction',
			'Contact',
			'Iframe',
		]) {
			// the button still takes the click; the window just ignores it
			await tab(page, name).click();
			await expect(tab(page, 'Chat')).toHaveClass(/wt-tab--highlight/);
		}
	});
});
