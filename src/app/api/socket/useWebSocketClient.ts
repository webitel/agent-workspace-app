import { eventBus } from '@webitel/ui-sdk/scripts';
import { markRaw, reactive, readonly, ref, shallowReactive } from 'vue';
import type { ClientEvents, RtpMetrics, SipPhone } from 'webitel-sdk';
import { Client } from 'webitel-sdk';
import { WebSocketClientEvent } from './enums/WebSocketClientEvent.enum';
import { WebSocketConnectionState } from './enums/WebSocketConnectionState.enum';

/* ============================================================================
 * Constants
 * ========================================================================== */

const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_RECONNECT_DELAY = 15000;

/* ============================================================================
 * Singleton state
 * ========================================================================== */

type EventCallback<T = unknown> = (payload: T) => void;

type EventMap = {
	[WebSocketClientEvent.AfterAuth]: EventCallback<Client>;
	[WebSocketClientEvent.Error]: ClientEvents['error'];
	[WebSocketClientEvent.CallMediaMetric]: ClientEvents['call_media_metric'];
	[WebSocketClientEvent.Disconnected]: ClientEvents['disconnected'];
};

let client: Client | null = null;
const state = ref<WebSocketConnectionState>(WebSocketConnectionState.Idle);

let clientInitPromise: Promise<Client> | null = null;
let reconnectAttemptCount = 0;
let reconnectTimerId: number | null = null;
let clientGenerationCount = 0;

const listeners: { [T in WebSocketClientEvent]: EventMap[T][] } = {
	[WebSocketClientEvent.AfterAuth]: [],
	[WebSocketClientEvent.Error]: [],
	[WebSocketClientEvent.CallMediaMetric]: [],
	[WebSocketClientEvent.Disconnected]: [
		handleDisconnect,
	],
};

/* ============================================================================
 * Environment
 * ========================================================================== */

const { hostname, protocol } = window.location;
const origin = `${protocol}//${hostname}`.replace(/^http/, 'ws');

const endpoint =
	import.meta.env.MODE === 'production'
		? `${origin}/ws`
		: import.meta.env.VITE_WEB_SOCKET_URL;

/* ============================================================================
 * Helpers
 * ========================================================================== */

function emit<K extends WebSocketClientEvent>(
	event: K,
	...payload: Parameters<EventMap[K]>
) {
	listeners[event].forEach((cb) => {
		// TS can't correlate union of callbacks with union of payloads, so cast
		(cb as (...args: Parameters<EventMap[K]>) => void)(...payload);
	});
}

type CliConfig = {
	registerWebDevice?: boolean;
	debug?: boolean;
};

function getCliConfig(): CliConfig {
	try {
		const configStr = localStorage.getItem('CONFIG');
		if (!configStr) return {};
		const parsedConfig = JSON.parse(configStr) as {
			CLI?: CliConfig;
		};
		return parsedConfig.CLI ?? {};
	} catch {
		return {};
	}
}

function attachCoreHandlers(cli: Client, generation: number) {
	cli.on('error', (e) => {
		if (generation !== clientGenerationCount) return;
		emit(WebSocketClientEvent.Error, e);
	});

	cli.on('disconnected', (code, err) => {
		if (generation !== clientGenerationCount) return;
		emit(WebSocketClientEvent.Disconnected, code, err);
	});

	cli.on('show_message', (e: unknown) => {
		if (generation !== clientGenerationCount) return;
		const event = (e ?? {}) as {
			type?: string;
			message?: string;
			timeout?: number;
		};
		eventBus.$emit('notification', {
			type: event.type,
			text: event.message,
			timeout: event.timeout,
		});
	});

	cli.on('call_media_metric', (e: RtpMetrics) => {
		emit(WebSocketClientEvent.CallMediaMetric, e);
	});

	cli.on('open_link', (e: unknown) => {
		const event = (e ?? {}) as {
			url?: string;
		};
		if (!event.url) return;
		const url = event.url.startsWith('https://')
			? event.url
			: `https://${event.url}`;
		window.open(url, '_blank');
	});
}

/**
 * Mark the asynchronously created phone UA instance as raw.
 *
 * The phone instance is created after auth, so we wait for it to appear
 * (or for the `phone_connected` event) and then wrap `cli.phone.ua` in
 * `markRaw` to prevent Vue from making it reactive.
 */
async function markAsyncPhoneRaw(cli: Client) {
	/*
    cli.phone.ua contains "configuration" property, which has no setter so cannot be wrapped with reactivity.
    so that, reactivity breaks
     for more info, see WTEL-4236
     */
	return new Promise<void>((resolve) => {
		const timeout = window.setTimeout(resolve, 5000);

		const markUa = () => {
			// @ts-expect-error should access and overwrite private property!
			if (!(cli.phone as SipPhone).ua) return;
			// @ts-expect-error should access and overwrite private property!
			(cli.phone as SipPhone).ua = markRaw((cli.phone as SipPhone).ua);
			clearTimeout(timeout);
			resolve();
		};

		// @ts-expect-error should access and overwrite private property!
		(cli.phone as SipPhone)?.ua ? markUa() : cli.on('phone_connected', markUa);
	});
}

/* ============================================================================
 * Lifecycle
 * ========================================================================== */

async function createClient(): Promise<Client> {
	const generation = ++clientGenerationCount;
	const token = localStorage.getItem('access-token');
	const cliConfig = getCliConfig();

	// why reactive? https://github.com/vuejs/core/discussions/7811#discussioncomment-5181921
	// const cli = new Client(config);
	const cli = shallowReactive(
		new Client({
			endpoint,
			token,
			registerWebDevice: cliConfig.registerWebDevice ?? true,
			debug: cliConfig.debug,
		}),
	);

	// why reactive? https://github.com/vuejs/core/discussions/7811#discussioncomment-5181921
	// @ts-expect-error should access and overwrite private property!
	cli.conversationStore = reactive(cli.conversationStore);
	// @ts-expect-error should access and overwrite private property!
	cli.callStore = reactive(cli.callStore);

	attachCoreHandlers(cli, generation);

	await cli.connect();
	await cli.auth();

	emit(WebSocketClientEvent.AfterAuth, cli);
	await markAsyncPhoneRaw(cli);

	(
		window as unknown as {
			cli?: Client | null;
		}
	).cli = cli;
	return cli;
}

async function destroyClient() {
	if (!client) return;

	try {
		await client.destroy?.();
	} catch (e) {
		console.warn('[WS] destroy error', e);
	} finally {
		client = null;
		state.value = WebSocketConnectionState.Disconnected;
		(
			window as unknown as {
				cli?: Client | null;
			}
		).cli = null;
	}
}

function scheduleReconnect() {
	if (reconnectTimerId || reconnectAttemptCount >= MAX_RECONNECT_ATTEMPTS)
		return;

	const delay = Math.min(
		1000 * 2 ** reconnectAttemptCount,
		MAX_RECONNECT_DELAY,
	);
	reconnectAttemptCount++;

	reconnectTimerId = window.setTimeout(async () => {
		reconnectTimerId = null;
		try {
			await getCliInstance({
				forceReconnect: true,
			});
			reconnectAttemptCount = 0;
		} catch {
			scheduleReconnect();
		}
	}, delay);
}

async function handleDisconnect() {
	if (state.value === WebSocketConnectionState.Reconnecting) return;

	state.value = WebSocketConnectionState.Reconnecting;
	await destroyClient();
	scheduleReconnect();
}

async function getCliInstance({
	forceReconnect = false,
}: {
	forceReconnect?: boolean;
} = {}): Promise<Client> {
	if (
		!forceReconnect &&
		client &&
		state.value === WebSocketConnectionState.Connected
	) {
		return client;
	}

	if (clientInitPromise) return clientInitPromise;

	state.value = client
		? WebSocketConnectionState.Reconnecting
		: WebSocketConnectionState.Connecting;

	clientInitPromise = (async () => {
		try {
			const cli = await createClient();
			client = cli;
			state.value = WebSocketConnectionState.Connected;
			return cli;
		} finally {
			clientInitPromise = null;
		}
	})();

	return clientInitPromise;
}

/* ============================================================================
 * Public API
 * ========================================================================== */

function on<K extends keyof EventMap>(
	event: K,
	cb: EventMap[K] | EventMap[K][],
) {
	Array.isArray(cb) ? listeners[event].push(...cb) : listeners[event].push(cb);
}

/* ----------------------------------------------------------------------------
 * Reactive slices
 *
 * The Client is a large library class. We do NOT expose it as one big reactive
 * object: most of its surface is consumed imperatively (connect, auth, call,
 * subscribeCall, on, ...). Reactivity is owned here, at the singleton, and
 * applied only to the sub-objects that modules actually observe.
 *
 * `callStore` / `conversationStore` are wrapped with `reactive()` in
 * `createClient`. `agent` is created lazily by `agentSession()`, so it is
 * wrapped on first access below. `reactive()` is idempotent (same proxy from
 * Vue's WeakMap), so every accessor returns the one shared proxy — no
 * per-module wrapping, no proxy-identity races.
 * ------------------------------------------------------------------------- */

async function getCallStore() {
	const cli = await getCliInstance();
	// @ts-expect-error private; wrapped reactive in createClient
	return cli.callStore;
}

async function getConversationStore() {
	const cli = await getCliInstance();
	// @ts-expect-error private; wrapped reactive in createClient
	return cli.conversationStore;
}

async function getAgentSession() {
	const cli = await getCliInstance();
	await cli.agentSession(); // populates cli.agent
	// idempotent — same proxy across modules. Cast: reactive()'s
	// UnwrapNestedRefs return type drops some Agent members.
	cli.agent = reactive(cli.agent) as typeof cli.agent;
	return cli.agent;
}

export function useWebSocketClient() {
	return {
		// live read — `client` is reassigned across reconnects, so a captured
		// value would go stale (it starts null before the first connect)
		get client() {
			return client;
		},
		state: readonly(state),

		// reactive slices (observe in templates/computed/watch)
		getCallStore,
		getConversationStore,
		getAgentSession,

		// imperative API
		getCliInstance,
		destroyClient,

		on,
		Event: WebSocketClientEvent,
	};
}
