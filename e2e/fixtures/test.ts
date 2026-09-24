import { test as base, type Page } from '@playwright/test';

import { type MockedSocket, mockAppApis, mockAppWebSocket } from './mocks';

/**
 * Test runner for the `mocked` project: seeds the single value the router
 * guard checks (`access-token`) plus the app config, then stubs the backend.
 *
 * Live tests import `@playwright/test` directly — their token is seeded by the
 * project's `storageState`.
 */

/** Keyed by page so the `socket` fixture can't pick up another test's socket. */
const sockets = new WeakMap<Page, MockedSocket>();

export const test = base.extend<{
	socket: MockedSocket;
}>({
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
		sockets.set(page, await mockAppWebSocket(page));

		await use(page);
	},

	/** Push server-initiated frames (call/chat events) at the running app. */
	socket: async ({ page }, use) => {
		const socket = sockets.get(page);
		if (!socket)
			throw new Error('socket fixture used without the page fixture');
		await use(socket);
	},
});

export { expect } from '@playwright/test';
