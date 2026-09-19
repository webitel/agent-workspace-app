import type { Page } from '@playwright/test';

import { expect, test } from './fixtures/test';

/**
 * The mocked agent session starts `online` (see `agentSessionPayload`), so the
 * dropdown offers Pause and Offline.
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

async function openStatusDropdown(page: Page) {
	const select = page.locator('.agent-status-select .wt-status-select');
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
	 * The one assertion the unit tests cannot make: unit tests assert against a
	 * mocked `pause()`, so they prove the store's intent, not the frame. This
	 * proves what leaves the browser. It still does not prove the server reads
	 * these field names — only a live round trip does that.
	 */
	test('sends the pause cause and comment on the wire', async ({
		page,
		socket,
	}) => {
		test.setTimeout(60_000);
		await mockPauseCauses(page);

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
		await popup.getByText('Dinner').click();
		await popup.locator('textarea').fill('back in 20');
		await popup.getByRole('button').first().click();

		await expect
			.poll(() => socket.sent('cc_agent_pause'), {
				timeout: 15_000,
			})
			.toEqual([
				{
					agent_id: 1,
					payload: {
						status_payload: 'Dinner',
						status_comment: 'back in 20',
					},
				},
			]);
	});

	test('pauses without asking when the agent has no causes', async ({
		page,
		socket,
	}) => {
		test.setTimeout(60_000);
		await mockPauseCauses(page, {
			items: [],
			next: false,
		});

		await page.goto('calls');
		await openStatusDropdown(page);
		await page
			.getByRole('option', {
				name: 'Pause',
			})
			.click();

		await expect
			.poll(() => socket.sent('cc_agent_pause'), {
				timeout: 15_000,
			})
			.toEqual([
				{
					agent_id: 1,
				},
			]);
		await expect(page.locator('.wt-cc-pause-cause-popup')).toBeHidden();
	});

	test('takes the agent offline without asking anything', async ({
		page,
		socket,
	}) => {
		test.setTimeout(60_000);
		await mockPauseCauses(page);

		await page.goto('calls');
		await openStatusDropdown(page);
		await page
			.getByRole('option', {
				name: 'Offline',
			})
			.click();

		await expect
			.poll(() => socket.sent('cc_agent_offline'), {
				timeout: 15_000,
			})
			.toEqual([
				{
					agent_id: 1,
				},
			]);
	});
});
