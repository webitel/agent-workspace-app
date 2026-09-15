import type { Page } from '@playwright/test';

export const session = {
	user_id: '1',
	userId: '1',
	username: 'e2e-agent',
	preferred_username: 'e2e-agent',
	name: 'E2E Agent',
	domain: 'e2e.local',
	scope: [],
	permissions: [],
	license: [],
	roles: [],
};

/**
 * `routeAccessGuard` sends the user to `/access-denied` unless the app this
 * route belongs to (`WtApplication.Agent`) is enabled here. The app's routes
 * declare no `UiSection`, so app-level visibility is all that is checked.
 */
export const visibilityAccess = {
	agent: {
		_enabled: true,
	},
};

export const helloPayload = {
	sock_id: 'e2e-sock',
	server_version: 'e2e',
	ping_interval: 0,
	session: {
		user_id: 1,
	},
	use_chat: false,
	b2bua: false,
};

/**
 * Intercepts every backend call the app shell makes on boot, so mocked tests
 * run without a reachable instance.
 */
export async function mockAppApis(page: Page) {
	await page.route('**/agent-workspace/config.json', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: '{}',
		});
	});
	for (const path of [
		'config.local.json',
		'config.jsonc',
		'config.local.jsonc',
	]) {
		await page.route(`**/agent-workspace/${path}`, async (route) => {
			await route.fulfill({
				status: 404,
				body: '',
			});
		});
	}
	await page.route('**/api/userinfo', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(session),
		});
	});
	await page.route('**/api/role/metadata/access', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(visibilityAccess),
		});
	});
	await page.route('**/api/user/settings/**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				timezone: 'UTC',
			}),
		});
	});
	await page.route('**/api/user-status', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				presence: '',
			}),
		});
	});
	await page.route('**/api/presence', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: '{}',
		});
	});
}

export async function mockAppWebSocket(page: Page) {
	// Do not intercept Vite HMR (`ws://localhost:...`).
	await page.routeWebSocket(/wss:\/\/.*\/(ws|im\/ws)/, (ws) => {
		ws.onMessage((payload) => {
			const raw = typeof payload === 'string' ? payload : payload.toString();
			let message: {
				seq?: number;
				action?: string;
			};
			try {
				message = JSON.parse(raw);
			} catch {
				return;
			}
			if (!message.seq) return;
			ws.send(
				JSON.stringify({
					seq_reply: message.seq,
					status: 'OK',
					data: {},
				}),
			);
		});

		ws.send(
			JSON.stringify({
				event: 'hello',
				data: helloPayload,
			}),
		);
	});
}
