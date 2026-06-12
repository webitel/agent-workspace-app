import { eventBus } from '@webitel/ui-sdk/scripts';
import { markRaw, reactive, ref, shallowReactive, shallowRef } from 'vue';
import type { ClientEvents, RtpMetrics, SipPhone } from 'webitel-sdk';
import { Client } from 'webitel-sdk';
import { WebSocketClientEvent } from './enums/WebSocketClientEvent.enum';
import { WebSocketConnectionState } from './enums/WebSocketConnectionState.enum';

/* ============================================================================
 * WebSocket client manager
 *
 * Owns the singleton webitel-sdk `Client` and its lifecycle. This is the
 * imperative core (connect/auth/reconnect/destroy + event fan-out) plus the
 * two mutable reactive primitives (`client`, `state`) it drives. The Vue
 * composable in `useWebSocketClient.ts` is a thin layer on top — it derives
 * the `computed` reactive slices and assembles the public API.
 * ========================================================================== */

const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_RECONNECT_DELAY = 15000;

type EventCallback<T = unknown> = (payload: T) => void;

export type EventMap = {
	[WebSocketClientEvent.AfterAuth]: EventCallback<Client>;
	[WebSocketClientEvent.Error]: ClientEvents['error'];
	[WebSocketClientEvent.CallMediaMetric]: ClientEvents['call_media_metric'];
	[WebSocketClientEvent.Disconnected]: ClientEvents['disconnected'];
};

/* ----------------------------------------------------------------------------
 * Reactive singleton state
 *
 * `client` is a shallowRef so derived computeds re-evaluate when the instance
 * is swapped (destroy -> recreate). The instance itself is shallowReactive so
 * its top-level fields (e.g. `agent`) stay tracked.
 * ------------------------------------------------------------------------- */

export const client = shallowRef<Client | null>(null);
export const state = ref<WebSocketConnectionState>(
	WebSocketConnectionState.Idle,
);

let connectPromise: Promise<void> | null = null;
let reconnectAttemptCount = 0;
let reconnectTimerId: number | null = null;

const listeners: { [T in WebSocketClientEvent]: EventMap[T][] } = {
	[WebSocketClientEvent.AfterAuth]: [],
	[WebSocketClientEvent.Error]: [],
	[WebSocketClientEvent.CallMediaMetric]: [],
	[WebSocketClientEvent.Disconnected]: [
		handleDisconnect,
	],
};

/* ----------------------------------------------------------------------------
 * Environment
 * ------------------------------------------------------------------------- */

const { hostname, protocol } = window.location;
const origin = `${protocol}//${hostname}`.replace(/^http/, 'ws');

const endpoint =
	import.meta.env.MODE === 'production'
		? `${origin}/ws`
		: import.meta.env.VITE_WEB_SOCKET_URL;

/* ----------------------------------------------------------------------------
 * Events
 * ------------------------------------------------------------------------- */

function emit<K extends WebSocketClientEvent>(
	event: K,
	...payload: Parameters<EventMap[K]>
) {
	listeners[event].forEach((cb) => {
		// TS can't correlate union of callbacks with union of payloads, so cast
		(cb as (...args: Parameters<EventMap[K]>) => void)(...payload);
	});
}

/**
 * Register a listener for a forwarded SDK event. Returns an unsubscribe
 * function so consuming composables can clean up on unmount.
 */
export function on<K extends keyof EventMap>(
	event: K,
	cb: EventMap[K] | EventMap[K][],
): () => void {
	const added = Array.isArray(cb)
		? cb
		: [
				cb,
			];
	listeners[event].push(...added);

	return () => {
		for (const fn of added) {
			const i = listeners[event].indexOf(fn);
			if (i !== -1) listeners[event].splice(i, 1);
		}
	};
}

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

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

function attachCoreHandlers(cli: Client) {
	cli.on('error', (e) => {
		emit(WebSocketClientEvent.Error, e);
	});

	cli.on('disconnected', (code, err) => {
		emit(WebSocketClientEvent.Disconnected, code, err);
	});

	cli.on('show_message', (e: unknown) => {
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

/* ----------------------------------------------------------------------------
 * Lifecycle
 *
 * Creating the Client is synchronous (`getClient`); establishing the live
 * session is asynchronous (`connect`). Splitting them lets the composable
 * expose the reactive slices as plain computeds — they resolve as soon as the
 * instance exists and fill in once `connect` completes.
 *
 * A single Client instance lives for the whole app session. Reconnects reuse
 * it (`disconnect` + reconnect) so the reactive store proxies keep their
 * identity. The instance is only torn down by `destroyClient` (logout); the
 * next `getClient` builds a fresh one with a fresh token.
 * ------------------------------------------------------------------------- */

function createClient(): Client {
	const token = localStorage.getItem('access-token');
	const cliConfig = getCliConfig();

	// why reactive? https://github.com/vuejs/core/discussions/7811#discussioncomment-5181921
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

	attachCoreHandlers(cli);

	return cli;
}

/**
 * Return the singleton Client, creating it synchronously on first access.
 * Does NOT connect — call `connect()` (or `getCliInstance()`) for that.
 */
export function getClient(): Client {
	if (!client.value) {
		client.value = createClient();
	}
	return client.value;
}

/**
 * Tear down the current session's socket and drop the entities that belonged
 * to it, so a reconnect on the same instance doesn't resurface stale
 * calls/conversations. The reactive store proxies are kept (only emptied).
 */
async function resetSession(cli: Client) {
	try {
		await cli.disconnect();
	} catch (e) {
		console.warn('[WS] disconnect error', e);
	}
	// @ts-expect-error should access private property!
	cli.callStore.clear();
	// @ts-expect-error should access private property!
	cli.conversationStore.clear();
}

/**
 * Establish (or re-establish) the live session: connect + auth on the singleton
 * instance. Idempotent — concurrent calls share one in-flight promise, and a
 * no-op when already Connected unless `force` is set.
 */
export async function connect({
	force = false,
}: {
	force?: boolean;
} = {}): Promise<void> {
	const cli = getClient();

	if (!force && state.value === WebSocketConnectionState.Connected) {
		return;
	}
	if (connectPromise) return connectPromise;

	const reconnecting =
		force ||
		state.value === WebSocketConnectionState.Connected ||
		state.value === WebSocketConnectionState.Reconnecting;
	state.value = reconnecting
		? WebSocketConnectionState.Reconnecting
		: WebSocketConnectionState.Connecting;

	connectPromise = (async () => {
		try {
			if (force) await resetSession(cli);

			await cli.connect();
			await cli.auth();

			state.value = WebSocketConnectionState.Connected;
			reconnectAttemptCount = 0;

			emit(WebSocketClientEvent.AfterAuth, cli);
			await markAsyncPhoneRaw(cli);

			(
				window as unknown as {
					cli?: Client | null;
				}
			).cli = cli;
		} finally {
			connectPromise = null;
		}
	})();

	return connectPromise;
}

export async function destroyClient() {
	if (!client.value) return;

	try {
		await client.value.destroy?.();
	} catch (e) {
		console.warn('[WS] destroy error', e);
	} finally {
		client.value = null;
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
			await connect({
				force: true,
			});
		} catch {
			scheduleReconnect();
		}
	}, delay);
}

async function handleDisconnect() {
	if (state.value === WebSocketConnectionState.Reconnecting) return;

	state.value = WebSocketConnectionState.Reconnecting;
	scheduleReconnect();
}

/**
 * Ensure a connected, authenticated client and return it.
 *
 * Backwards-compatible async accessor. Prefer the synchronous `getClient` +
 * `connect` split for new code; this remains for callers that want "give me a
 * ready client" in one await.
 */
export async function getCliInstance({
	forceReconnect = false,
}: {
	forceReconnect?: boolean;
} = {}): Promise<Client> {
	await connect({
		force: forceReconnect,
	});
	return getClient();
}

/**
 * Resolve the agent session and wrap `agent` reactively. `agentSession()` is a
 * network call, so this stays async — the `agent` computed slice mirrors the
 * wrapped value once this resolves. `reactive()` is idempotent, so repeated
 * calls return the one shared proxy.
 */
export async function getAgentSession() {
	const cli = getClient();
	await cli.agentSession(); // populates cli.agent
	// Cast: reactive()'s UnwrapNestedRefs return type drops some Agent members.
	cli.agent = reactive(cli.agent) as typeof cli.agent;
	return cli.agent;
}
