import { test as base } from '@playwright/test';

import { mockAppApis, mockAppWebSocket } from './mocks';

/**
 * Test runner for the `mocked` project: seeds the single value the router
 * guard checks (`access-token`) plus the app config, then stubs the backend.
 *
 * Live tests import `@playwright/test` directly — their token is seeded by the
 * project's `storageState`.
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		await page.addInitScript(() => {
			localStorage.setItem('access-token', 'e2e-token');
			localStorage.setItem(
				'CONFIG',
				JSON.stringify({
					CLI: {
						registerWebDevice: false,
					},
				}),
			);
		});

		await mockAppApis(page);
		await mockAppWebSocket(page);

		await use(page);
	},
});

export { expect } from '@playwright/test';
