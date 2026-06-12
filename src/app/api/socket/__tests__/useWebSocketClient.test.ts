import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockEmit as emitMock } from '../../../../../test/setup';
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
	conversationStore = new Map();
	callStore = new Map();
	connect = vi.fn().mockResolvedValue(undefined);
	auth = vi.fn().mockResolvedValue(undefined);
	disconnect = vi.fn().mockResolvedValue(undefined);
	destroy = vi.fn().mockResolvedValue(undefined);
	agent = {};
	agentSession = vi.fn().mockResolvedValue(undefined);

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

		it('forceReconnect reuses the same instance, re-establishing its session', async () => {
			const api = await loadModule();

			const a = await api.getCliInstance();
			const b = await api.getCliInstance({
				forceReconnect: true,
			});

			// one stable instance across reconnects (preserves reactive proxies)
			expect(a).toBe(b);
			expect(FakeClient.instances).toHaveLength(1);
			expect(a.disconnect).toHaveBeenCalledOnce();
			expect(a.connect).toHaveBeenCalledTimes(2);
			expect(a.auth).toHaveBeenCalledTimes(2);
		});

		it('forceReconnect clears the entity stores from the dropped session', async () => {
			const api = await loadModule();

			const cli = await api.getCliInstance();
			cli.callStore.set('c1', {});
			cli.conversationStore.set('conv1', {});

			await api.getCliInstance({ forceReconnect: true });

			expect(cli.callStore.size).toBe(0);
			expect(cli.conversationStore.size).toBe(0);
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

		it('enters Reconnecting and re-establishes the same instance after backoff', async () => {
			const api = await loadModule();
			const cli = await api.getCliInstance();

			cli.fire('disconnected', 1006, 'gone');
			expect(api.state.value).toBe(WebSocketConnectionState.Reconnecting);

			// first backoff is 1000 * 2^0 = 1000ms
			await vi.advanceTimersByTimeAsync(1000);

			// reused, not rebuilt — reactive proxies survive the reconnect
			expect(FakeClient.instances).toHaveLength(1);
			expect(cli.disconnect).toHaveBeenCalledOnce();
			expect(cli.connect).toHaveBeenCalledTimes(2);
			expect(api.state.value).toBe(WebSocketConnectionState.Connected);
		});
	});

	describe('reactive slices', () => {
		it('getClient creates the instance synchronously without connecting', async () => {
			const api = await loadModule();

			const cli = api.getClient();

			expect(cli).toBeDefined();
			expect(FakeClient.instances).toHaveLength(1);
			expect(cli.connect).not.toHaveBeenCalled();
			expect(api.state.value).toBe(WebSocketConnectionState.Idle);
		});

		it('exposes the same store proxies before and after connect', async () => {
			const api = await loadModule();

			const callStoreBefore = api.getCallStore();
			const convStoreBefore = api.getConversationStore();

			await api.connect();

			// identity preserved — components binding before connect stay live
			expect(api.getCallStore()).toBe(callStoreBefore);
			expect(api.getConversationStore()).toBe(convStoreBefore);
		});

		it('getAgentSession resolves the agent and wraps it once', async () => {
			const api = await loadModule();

			const agentA = await api.getAgentSession();
			const agentB = await api.getAgentSession();

			expect(api.getClient().agentSession).toHaveBeenCalledTimes(2);
			expect(agentA).toBe(agentB); // idempotent reactive wrap
		});
	});
});
