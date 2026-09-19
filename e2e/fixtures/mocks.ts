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

/**
 * `cc_agent_session` reply. The SDK's `Agent` constructor iterates `channels`
 * immediately, so an empty object throws and the workspace falls back to its
 * no-agent path — which would quietly disable the whole task feed in tests.
 */
export const agentSessionPayload = {
	agent_id: 1,
	channels: [],
	status: 'online',
	on_demand: false,
};

/** `cc_agent_tasks` reply — the agent's already-open tasks at session start. */
export const agentTasksPayload = {
	items: [],
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
	// `getUserStatus` reads `data.presence.status` from `/user`
	await page.route('**/api/user', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				presence: {
					status: '',
				},
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

/** Per-action reply bodies; everything unmodelled still gets an empty object. */
function replyFor(action?: string): object {
	switch (action) {
		case 'cc_agent_session':
			return agentSessionPayload;
		case 'cc_agent_tasks':
			return agentTasksPayload;
		default:
			return {};
	}
}

/**
 * Lets a spec push server-initiated frames once the app has connected.
 *
 * `channel` picks which socket the frame goes to: the app opens two, the
 * webitel-sdk one at `/ws` and the chat-web-sdk one at `/im/ws`.
 */
export interface MockedSocket {
	send(event: string, data: unknown, channel?: MockedSocketChannel): void;
}

export type MockedSocketChannel = 'main' | 'chat';

export async function mockAppWebSocket(page: Page): Promise<MockedSocket> {
	type RoutedSocket = Parameters<Parameters<Page['routeWebSocket']>[1]>[0];

	/*
	 * Keyed by channel, not a single slot. Both sockets match the same route, so
	 * a single slot silently pointed at whichever connected last — the chat one.
	 * Every call frame a spec pushed after that went to the wrong SDK and was
	 * dropped without a trace.
	 */
	const sockets: Partial<Record<MockedSocketChannel, RoutedSocket>> = {};
	// frames a spec pushed before the app finished connecting
	const queued: Partial<Record<MockedSocketChannel, string[]>> = {};

	const channelOf = (url: string): MockedSocketChannel =>
		/\/im\/ws\b/.test(url) ? 'chat' : 'main';

	// Do not intercept Vite HMR (`ws://localhost:...`).
	await page.routeWebSocket(/wss:\/\/.*\/(ws|im\/ws)/, (ws) => {
		const channel = channelOf(ws.url());
		sockets[channel] = ws;
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
					data: replyFor(message.action),
				}),
			);
		});

		ws.send(
			JSON.stringify({
				event: 'hello',
				data: helloPayload,
			}),
		);

		for (const frame of queued[channel]?.splice(0) ?? []) {
			ws.send(frame);
		}
	});

	return {
		send(event, data, channel = 'main') {
			const frame = JSON.stringify({
				event,
				data,
			});
			const target = sockets[channel];
			if (target) target.send(frame);
			else (queued[channel] ??= []).push(frame);
		},
	};
}

/**
 * A `ringing` call frame, shaped the way `Client.handleCallEvents` expects so the
 * SDK builds a real `Call` from it.
 */
export function callRingingFrame({
	id = 'e2e-call-1',
	name = 'John Smith',
	number = '380671234678',
	queueName = 'Support',
	hideNumber = false,
}: {
	id?: string;
	name?: string;
	number?: string;
	queueName?: string;
	hideNumber?: boolean;
} = {}) {
	return {
		call: {
			id,
			app_id: 'e2e',
			cc_app_id: '',
			event: 'ringing',
			timestamp: Date.now(),
			data: {
				direction: 'inbound',
				destination: number,
				from: {
					name,
					number,
					type: 'sip',
				},
				queue: {
					attempt_id: 1,
					member_id: '1',
					queue_id: '1',
					queue_name: queueName,
					queue_type: 'inbound',
					reporting: '',
				},
				params: {},
				payload: {},
				hide_number: hideNumber,
			},
		},
	};
}

/**
 * A `hangup` frame for a call the SDK already knows about. The SDK drops the
 * call from its store, which is how an offer card goes away — the app never
 * removes one itself.
 */
export function callHangupFrame({ id = 'e2e-call-1' }: { id?: string } = {}) {
	return {
		call: {
			id,
			app_id: 'e2e',
			cc_app_id: '',
			event: 'hangup',
			timestamp: Date.now(),
			data: {
				cause: 'NORMAL_CLEARING',
				sip: 200,
			},
		},
	};
}
