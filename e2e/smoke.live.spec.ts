import { expect, test } from './fixtures/live';

/**
 * Runs against the real instance configured in `.env.e2e`, authorized by the
 * token seeded into localStorage by the `live` project's `storageState`.
 */
test.describe('live smoke', () => {
	test('boots the workspace without redirecting to auth', async ({ page }) => {
		test.setTimeout(60_000);

		await page.goto('calls');

		await expect(page.locator('.the-agent-workspace')).toBeVisible({
			timeout: 30_000,
		});
		await expect(page).toHaveURL(/\/agent-workspace\/calls/);
	});

	test('loads the signed-in agent from the backend', async ({ page }) => {
		test.setTimeout(60_000);

		const userinfo = page.waitForResponse(
			(response) =>
				response.url().includes('/api/userinfo') && response.status() === 200,
		);

		await page.goto('calls');

		expect((await userinfo).status()).toBe(200);
		await expect(page.locator('.wt-app-header')).toBeVisible({
			timeout: 30_000,
		});
	});
});
