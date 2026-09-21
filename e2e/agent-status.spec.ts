import type { Page } from '@playwright/test';

import { expect, test } from './fixtures/test';

/**
 * The mocked agent session starts `online` (see `agentSessionPayload`), so the
 * dropdown offers Pause and Offline.
 *
 * Status is written over REST by the SDK's status select and read back off the
 * websocket session, so these specs assert the PATCH body — that is the
 * contract this app depends on.
 */

const pauseCauses = {
	items: [
		{
			id: '1',
			name: 'Dinner',
			duration_min: 5,
			limit_min: 55,
			allow_change: true,
		},
	],
	next: false,
};

async function mockPauseCauses(page: Page, body: object = pauseCauses) {
	await page.route('**/call_center/agents/*/pause_causes*', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(body),
		});
	});
}

/** Records every status PATCH the app makes, and answers each one. */
async function captureStatusWrites(page: Page): Promise<unknown[]> {
	const writes: unknown[] = [];

	await page.route('**/call_center/agents/*/status', async (route) => {
		writes.push(route.request().postDataJSON());
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: '{}',
		});
	});

	return writes;
}

async function openStatusDropdown(page: Page) {
	// `.wt-status-select` lands on both the wrapper and the primevue root.
	const select = page.locator('.agent-status-select .p-select');
	await expect(select).toBeVisible({
		timeout: 30_000,
	});
	await select.click();
}

test.describe('agent status select', () => {
	test('offers the agent their status once the session is up', async ({
		page,
	}) => {
		test.setTimeout(60_000);
		await mockPauseCauses(page);

		await page.goto('calls');

		await expect(page.locator('.agent-status-select')).toBeVisible({
			timeout: 30_000,
		});
	});

	/*
	 * Guards the read path: the status shown comes off the websocket session,
	 * which only stays current because initializeAgent subscribes.
	 */
	test('follows a status the server pushes', async ({ page, socket }) => {
		test.setTimeout(60_000);
		await mockPauseCauses(page);

		await page.goto('calls');

		const indicator = page.locator(
			'.agent-status-select .wt-indicator__indicator',
		);
		// the mocked session starts online
		await expect(indicator).toHaveClass(/wt-indicator__indicator--success/, {
			timeout: 30_000,
		});

		socket.send('agent_status', {
			user_id: 1,
			agent_id: 1,
			timestamp: Date.now(),
			status: 'pause',
			status_comment: '',
			channels: [],
		});

		await expect(indicator).toHaveClass(/wt-indicator__indicator--primary/, {
			timeout: 15_000,
		});
	});

	test('writes the pause cause and comment the agent gave', async ({
		page,
	}) => {
		test.setTimeout(60_000);
		await mockPauseCauses(page);
		const writes = await captureStatusWrites(page);

		await page.goto('calls');
		await openStatusDropdown(page);
		await page
			.getByRole('option', {
				name: 'Pause',
			})
			.click();

		const popup = page.locator('.wt-cc-pause-cause-popup');
		await expect(popup).toBeVisible({
			timeout: 30_000,
		});
		await popup
			.getByRole('radio', {
				name: 'Dinner',
			})
			.click();
		await popup.locator('textarea').fill('back in 20');
		await popup
			.getByRole('button', {
				name: 'Ok',
			})
			.click();

		await expect
			.poll(() => writes, {
				timeout: 15_000,
			})
			.toEqual([
				{
					status: 'pause',
					payload: 'Dinner',
					status_comment: 'back in 20',
				},
			]);
	});

	test('pauses without asking when the agent has no causes', async ({
		page,
	}) => {
		test.setTimeout(60_000);
		await mockPauseCauses(page, {
			items: [],
			next: false,
		});
		const writes = await captureStatusWrites(page);

		await page.goto('calls');
		await openStatusDropdown(page);
		await page
			.getByRole('option', {
				name: 'Pause',
			})
			.click();

		await expect
			.poll(() => writes, {
				timeout: 15_000,
			})
			.toEqual([
				{
					status: 'pause',
				},
			]);
		await expect(page.locator('.wt-cc-pause-cause-popup')).toBeHidden();
	});

	test('takes the agent offline without asking anything', async ({ page }) => {
		test.setTimeout(60_000);
		await mockPauseCauses(page);
		const writes = await captureStatusWrites(page);

		await page.goto('calls');
		await openStatusDropdown(page);
		await page
			.getByRole('option', {
				name: 'Offline',
			})
			.click();

		await expect
			.poll(() => writes, {
				timeout: 15_000,
			})
			.toEqual([
				{
					status: 'offline',
				},
			]);
	});
});
