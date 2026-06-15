import { eventBus } from '@webitel/ui-sdk/scripts';
import { markRaw, reactive, ref, shallowReactive, shallowRef } from 'vue';
import type { ClientEvents, RtpMetrics, SipPhone } from 'webitel-sdk';
import { Client } from 'webitel-sdk';
import { WebSocketClientEvent } from './enums/WebSocketClientEvent.enum';
import { WebSocketConnectionState } from './enums/WebSocketConnectionState.enum';
import { createReconnector } from './utils/reconnector';

/**
 * Socket client manager: owns the singleton webitel-sdk `Client`, its lifecycle
 * (connect/auth/reconnect/destroy), event fan-out and the reactive primitives
 * (`client`, `state`). `useWebSocketClient` layers the reactive slices and
 * public API on top.
 */

const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_RECONNECT_DELAY = 15000;

type EventCallback<T = unknown> = (payload: T) => void;

export type EventMap = {
	[WebSocketClientEvent.AfterAuth]: EventCallback<Client>;
	[WebSocketClientEvent.Error]: ClientEvents['error'];
	[WebSocketClientEvent.CallMediaMetric]: ClientEvents['call_media_metric'];
	[WebSocketClientEvent.Disconnected]: ClientEvents['disconnected'];
};

// shallowRef so derived computeds re-resolve when the instance is swapped
// (destroy -> recreate); the instance stays shallowReactive so its top-level
// fields (e.g. agent) track.
export const client = shallowRef<Client | null>(null);
export const state = ref<WebSocketConnectionState>(
	WebSocketConnectionState.Idle,
);

let connectPromise: Promise<void> | null = null;

const listeners: { [T in WebSocketClientEvent]: EventMap[T][] } = {
	[WebSocketClientEvent.AfterAuth]: [],
	[WebSocketClientEvent.Error]: [],
	[WebSocketClientEvent.CallMediaMetric]: [],
	[WebSocketClientEvent.Disconnected]: [
		handleDisconnect,
	],
};

const { hostname, protocol } = window.location;
const origin = `${protocol}//${hostname}`.replace(/^http/, 'ws');

const endpoint =
	import.meta.env.MODE === 'production'
		? `${origin}/ws`
		: import.meta.env.VITE_WEB_SOCKET_URL;

function emit<K extends WebSocketClientEvent>(
	event: K,
	...payload: Parameters<EventMap[K]>
) {
	listeners[event].forEach((cb) => {
		// TS can't correlate union of callbacks with union of payloads, so cast
		(cb as (...args: Parameters<EventMap[K]>) => void)(...payload);
	});
}

/** Subscribe to a forwarded SDK event; returns an unsubscribe fn. */
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
 * cli.phone.ua is created after auth and has a setter-less `configuration` prop
 * that breaks Vue reactivity (WTEL-4236), so markRaw it once it appears (or on
 * `phone_connected`).
 */
async function markAsyncPhoneRaw(cli: Client) {
	return new Promise<void>((resolve) => {
		const timeout = window.setTimeout(resolve, 5000);

		const markUa = () => {
			// @ts-expect-error private
			if (!(cli.phone as SipPhone).ua) return;
			// @ts-expect-error private
			(cli.phone as SipPhone).ua = markRaw((cli.phone as SipPhone).ua);
			clearTimeout(timeout);
			resolve();
		};

		// @ts-expect-error private
		(cli.phone as SipPhone)?.ua ? markUa() : cli.on('phone_connected', markUa);
	});
}

// Creating the Client is sync (getClient); establishing the session is async
// (connect). One instance lives for the whole session — reconnects reuse it so
// the reactive store proxies keep identity; only destroyClient tears it down.

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

	// @ts-expect-error private
	cli.conversationStore = reactive(cli.conversationStore);
	// @ts-expect-error private
	cli.callStore = reactive(cli.callStore);

	attachCoreHandlers(cli);

	return cli;
}

/** Singleton Client, created (sync) on first access. Does not connect. */
export function getClient(): Client {
	if (!client.value) {
		client.value = createClient();
	}
	return client.value;
}

/** Expose the live client on window for debugging. */
function setWindowCli(cli: Client | null) {
	(
		window as unknown as {
			cli?: Client | null;
		}
	).cli = cli;
}

/**
 * Close the socket and empty this session's stores so a reconnect doesn't
 * resurface stale calls/conversations (store proxies kept, just cleared).
 */
async function resetSession(cli: Client) {
	try {
		await cli.disconnect();
	} catch (e) {
		console.warn('[WS] disconnect error', e);
	}
	// @ts-expect-error private
	cli.callStore.clear();
	// @ts-expect-error private
	cli.conversationStore.clear();
}

/**
 * Connect + auth on the singleton. Idempotent: concurrent calls share one
 * in-flight promise; no-op when Connected unless `force`.
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
			// cancel (not just reset) so a backoff timer pending from a prior
			// disconnect can't later force-reconnect this healthy socket
			reconnector.cancel();

			emit(WebSocketClientEvent.AfterAuth, cli);
			await markAsyncPhoneRaw(cli);

			setWindowCli(cli);
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
		reconnector.cancel();
		client.value = null;
		state.value = WebSocketConnectionState.Disconnected;
		setWindowCli(null);
	}
}

const reconnector = createReconnector(
	() =>
		connect({
			force: true,
		}),
	{
		maxAttempts: MAX_RECONNECT_ATTEMPTS,
		maxDelay: MAX_RECONNECT_DELAY,
	},
);

async function handleDisconnect() {
	if (state.value === WebSocketConnectionState.Reconnecting) return;

	state.value = WebSocketConnectionState.Reconnecting;
	reconnector.schedule();
}

// SDK Client.latency() is marked private (looks unintentional — likely a backend
// oversight, not a real contract). Until it's exposed upstream, the cast lives
// here in one place instead of at every call site. WTEL-8733.
type WithLatency = {
	latency(): Promise<number>;
};

/**
 * Current socket round-trip latency (ms), read from the already-connected
 * singleton (the session is brought up once in the workspace store).
 */
export async function latency(): Promise<number> {
	return (getClient() as unknown as WithLatency).latency();
}

/** Resolve the agent session (network) and wrap `agent` reactively (idempotent). */
export async function getAgentSession() {
	const cli = getClient();
	await cli.agentSession(); // populates cli.agent
	// Cast: reactive()'s UnwrapNestedRefs return type drops some Agent members.
	cli.agent = reactive(cli.agent) as typeof cli.agent;
	return cli.agent;
}
