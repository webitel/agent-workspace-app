import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockEmit as emitMock } from '../../../../test/setup';
import { WebSocketConnectionState } from '../enums/WebSocketConnectionState.enum';

// eventBus is mocked globally in src/test/setup.ts (eventBus.$emit -> mockEmit)

// Fake Client: records instances, lets tests fire SDK events synchronously.
// `phone.ua` is present so markAsyncPhoneRaw resolves immediately (no 5s wait).
class FakeClient {
	static instances: FakeClient[] = [];
	config: unknown;
	handlers: Record<string, ((...a: unknown[]) => void)[]> = {};
	phone = {
		ua: {},
	};
	conversationStore = {};
	callStore = {};
	connect = vi.fn().mockResolvedValue(undefined);
	auth = vi.fn().mockResolvedValue(undefined);
	destroy = vi.fn().mockResolvedValue(undefined);

	constructor(config: unknown) {
		this.config = config;
		FakeClient.instances.push(this);
	}

	on(event: string, cb: (...a: unknown[]) => void) {
		this.handlers[event] ??= [];
		this.handlers[event].push(cb);
	}

	fire(event: string, ...args: unknown[]) {
		for (const cb of this.handlers[event] ?? []) {
			cb(...args);
		}
	}
}

vi.mock('webitel-sdk', () => ({
	Client: FakeClient,
}));

// Fresh module (singleton state) per test.
async function loadModule() {
	vi.resetModules();
	FakeClient.instances = [];
	const mod = await import('../useWebSocketClient');
	return mod.useWebSocketClient();
}

describe('useWebSocketClient', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe('getCliInstance', () => {
		it('connects + authenticates and reports Connected', async () => {
			const api = await loadModule();

			const cli = await api.getCliInstance();

			expect(FakeClient.instances).toHaveLength(1);
			// cli is a shallowReactive proxy over the raw instance — assert through it
			expect(cli.connect).toHaveBeenCalledOnce();
			expect(cli.auth).toHaveBeenCalledOnce();
			expect(api.state.value).toBe(WebSocketConnectionState.Connected);
		});

		it('reuses the cached client while Connected', async () => {
			const api = await loadModule();

			const a = await api.getCliInstance();
			const b = await api.getCliInstance();

			expect(a).toBe(b);
			expect(FakeClient.instances).toHaveLength(1);
		});

		it('dedupes concurrent calls into one client', async () => {
			const api = await loadModule();

			const [a, b] = await Promise.all([
				api.getCliInstance(),
				api.getCliInstance(),
			]);

			expect(a).toBe(b);
			expect(FakeClient.instances).toHaveLength(1);
		});

		it('forceReconnect builds a new client even when Connected', async () => {
			const api = await loadModule();

			await api.getCliInstance();
			await api.getCliInstance({
				forceReconnect: true,
			});

			expect(FakeClient.instances).toHaveLength(2);
		});

		it('reads endpoint/token config from localStorage', async () => {
			localStorage.setItem('access-token', 'tok-123');
			localStorage.setItem(
				'CONFIG',
				JSON.stringify({
					CLI: {
						debug: true,
					},
				}),
			);
			const api = await loadModule();

			await api.getCliInstance();

			expect(FakeClient.instances[0].config).toMatchObject({
				token: 'tok-123',
				debug: true,
				registerWebDevice: true, // defaulted on
			});
		});
	});

	describe('destroyClient', () => {
		it('destroys the client and reports Disconnected', async () => {
			const api = await loadModule();
			const cli = await api.getCliInstance();

			await api.destroyClient();

			expect(cli.destroy).toHaveBeenCalledOnce();
			expect(api.state.value).toBe(WebSocketConnectionState.Disconnected);
		});
	});

	describe('event pipeline', () => {
		it('forwards SDK events to registered listeners', async () => {
			const api = await loadModule();
			const onMetric = vi.fn();
			api.on(api.Event.CallMediaMetric, onMetric);

			const cli = await api.getCliInstance();
			cli.fire('call_media_metric', {
				mos: {
					average: 4,
				},
			});

			expect(onMetric).toHaveBeenCalledWith({
				mos: {
					average: 4,
				},
			});
		});

		it('ignores events from a stale (superseded) client generation', async () => {
			const api = await loadModule();
			const onError = vi.fn();
			api.on(api.Event.Error, onError);

			const first = await api.getCliInstance();
			await api.getCliInstance({
				forceReconnect: true,
			}); // bumps generation

			first.fire('error', new Error('stale'));

			expect(onError).not.toHaveBeenCalled();
		});

		it('emits a notification on the SDK show_message event', async () => {
			const api = await loadModule();
			const cli = await api.getCliInstance();

			cli.fire('show_message', {
				type: 'info',
				message: 'hi',
				timeout: 3000,
			});

			expect(emitMock).toHaveBeenCalledWith('notification', {
				type: 'info',
				text: 'hi',
				timeout: 3000,
			});
		});
	});

	describe('reconnect on disconnect', () => {
		beforeEach(() => vi.useFakeTimers());
		afterEach(() => vi.useRealTimers());

		it('enters Reconnecting and rebuilds the client after backoff', async () => {
			const api = await loadModule();
			const cli = await api.getCliInstance();

			cli.fire('disconnected', 1006, 'gone');
			expect(api.state.value).toBe(WebSocketConnectionState.Reconnecting);

			// first backoff is 1000 * 2^0 = 1000ms
			await vi.advanceTimersByTimeAsync(1000);

			expect(FakeClient.instances).toHaveLength(2);
			expect(api.state.value).toBe(WebSocketConnectionState.Connected);
		});
	});
});
