import { test as base } from '@playwright/test';

/**
 * Test runner for the `live` project. Authorization comes from the project's
 * `storageState` (see `playwright.config.ts`); this only smooths over endpoints
 * the target instance has not deployed yet.
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		/**
		 * `GET /user-status` is newer than the test instance. App bootstrap
		 * awaits it and aborts the whole init on failure, so a 404 leaves a
		 * blank page. Pass the real response through; substitute only while the
		 * endpoint is genuinely missing, so this stops applying on its own once
		 * the instance catches up.
		 */
		await page.route('**/api/user-status', async (route) => {
			const response = await route.fetch();

			if (response.status() !== 404) {
				await route.fulfill({
					response,
				});
				return;
			}

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					presence: '',
				}),
			});
		});

		await use(page);
	},
});

test.beforeEach(() => {
	test.skip(
		!process.env.E2E_ACCESS_TOKEN,
		'E2E_ACCESS_TOKEN is not set — copy `.env.e2e.local.example` to `.env.e2e.local`.',
	);
});

export { expect } from '@playwright/test';
