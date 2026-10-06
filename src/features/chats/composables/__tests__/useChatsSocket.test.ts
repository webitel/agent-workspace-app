import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Captures the SDK's connection-state callbacks so tests can report a drop.
const stateHandlers = new Map<string, (() => void)[]>();
const enterState = (state: string) => {
	for (const handler of stateHandlers.get(state) ?? []) handler();
};
const onStateMock = vi.fn((state: string, callback: () => void) => {
	stateHandlers.set(state, [
		...(stateHandlers.get(state) ?? []),
		callback,
	]);
});

const connectMock = vi.fn();
// the SDK reports `disconnected` synchronously from disconnect(), like here
const disconnectMock = vi.fn(() => {
	enterState('disconnected');
});
// Captures the SDK-level ThreadMessage callback so tests can emit an event.
let sdkMessageHandler: ((data: unknown) => void) | null = null;
const onMessageMock = vi.fn((_event: string, cb: (data: unknown) => void) => {
	sdkMessageHandler = cb;
});

const createChatsSocketClientMock = vi.fn((..._args: unknown[]) => ({
	connect: connectMock,
	disconnect: disconnectMock,
	onMessage: onMessageMock,
	onState: onStateMock,
}));
const createSocketConfigMock = vi.fn((...args: unknown[]) => args[0]);

vi.mock('@webitel/chat-web-sdk', () => ({
	ChatsSocketMessage: {
		ThreadMessage: 'messageEvent',
	},
	ChatsSocketConnectionStatus: {
		Disconnected: 'disconnected',
		Error: 'error',
	},
	createChatsSocketClient: (...args: unknown[]) =>
		createChatsSocketClientMock(...args),
	createSocketConfig: (...args: unknown[]) => createSocketConfigMock(...args),
}));

vi.mock('../../api/chatSdk', () => ({
	serviceConfig: {
		marker: 'service-config',
	},
}));

import { useChatsSocket } from '../useChatsSocket';

describe('useChatsSocket', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		sdkMessageHandler = null;
		stateHandlers.clear();
		// clearAllMocks keeps queued once-answers; a test that leaves one unused
		// must not hand it to the next test's connect
		connectMock.mockReset();
		vi.stubEnv('VITE_CHAT_WEB_SOCKET_URL', 'wss://test.webitel.me/chat/ws');
		localStorage.setItem('access-token', 'tok-123');
	});

	afterEach(() => {
		// reset the module-level singleton client between tests
		useChatsSocket().disconnect();
		vi.unstubAllEnvs();
		localStorage.clear();
	});

	it('builds the socket config from env + token and connects, reusing serviceConfig', async () => {
		const { connect } = useChatsSocket();

		await connect();

		expect(createSocketConfigMock).toHaveBeenCalledWith({
			baseUrl: 'wss://test.webitel.me/chat/ws',
			accessToken: 'tok-123',
		});
		expect(createChatsSocketClientMock).toHaveBeenCalledWith({
			socketConfig: {
				baseUrl: 'wss://test.webitel.me/chat/ws',
				accessToken: 'tok-123',
			},
			serviceConfig: {
				marker: 'service-config',
			},
		});
		expect(connectMock).toHaveBeenCalledOnce();
	});

	it('does not create a second client while one is already connected', async () => {
		const { connect } = useChatsSocket();

		await connect();
		await connect();

		expect(createChatsSocketClientMock).toHaveBeenCalledOnce();
	});

	it('fans a ThreadMessage out to every registered handler', async () => {
		const { connect, onThreadMessage } = useChatsSocket();
		await connect();
		const first = vi.fn();
		const second = vi.fn();
		onThreadMessage(first);
		onThreadMessage(second);

		const message = {
			id: 'm1',
			threadId: 'chat-1',
		};
		sdkMessageHandler?.(message);

		expect(first).toHaveBeenCalledWith(message);
		expect(second).toHaveBeenCalledWith(message);
	});

	it('stops delivering to a handler after its unsubscribe runs', async () => {
		const { connect, onThreadMessage } = useChatsSocket();
		await connect();
		const handler = vi.fn();
		const stop = onThreadMessage(handler);

		stop();
		sdkMessageHandler?.({
			id: 'm1',
			threadId: 'chat-1',
		});

		expect(handler).not.toHaveBeenCalled();
	});

	describe('after the socket drops', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('connects again after a second, backing off while attempts fail', async () => {
			const { connect } = useChatsSocket();
			await connect();
			connectMock.mockRejectedValueOnce(new Error('still down'));

			enterState('disconnected');
			await vi.advanceTimersByTimeAsync(999);
			expect(connectMock).toHaveBeenCalledTimes(1);
			await vi.advanceTimersByTimeAsync(1);
			expect(connectMock).toHaveBeenCalledTimes(2);

			// the failed attempt reports its own drop
			enterState('disconnected');
			await vi.advanceTimersByTimeAsync(1_999);
			expect(connectMock).toHaveBeenCalledTimes(2);
			await vi.advanceTimersByTimeAsync(1);
			expect(connectMock).toHaveBeenCalledTimes(3);
		});

		it('makes one attempt for a drop that reports both error and disconnected', async () => {
			const { connect } = useChatsSocket();
			await connect();

			enterState('error');
			enterState('disconnected');
			await vi.advanceTimersByTimeAsync(60_000);

			expect(connectMock).toHaveBeenCalledTimes(2);
		});

		it('starts the backoff over once an attempt is answered', async () => {
			const { connect } = useChatsSocket();
			await connect();
			enterState('disconnected');
			await vi.advanceTimersByTimeAsync(1_000);

			enterState('disconnected');
			await vi.advanceTimersByTimeAsync(1_000);

			expect(connectMock).toHaveBeenCalledTimes(3);
		});

		it('tells reconnect listeners once a retry is answered, never on the first connect', async () => {
			const reconnected = vi.fn();
			const { connect, onReconnected } = useChatsSocket();
			onReconnected(reconnected);

			await connect();
			expect(reconnected).not.toHaveBeenCalled();

			enterState('disconnected');
			await vi.advanceTimersByTimeAsync(1_000);
			expect(reconnected).toHaveBeenCalledOnce();
		});

		it('stops telling a listener that unsubscribed', async () => {
			const reconnected = vi.fn();
			const { connect, onReconnected } = useChatsSocket();
			const unsubscribe = onReconnected(reconnected);
			await connect();

			unsubscribe();
			enterState('disconnected');
			await vi.advanceTimersByTimeAsync(1_000);

			expect(reconnected).not.toHaveBeenCalled();
		});

		it('does not reconnect a socket disconnected on purpose', async () => {
			const { connect, disconnect } = useChatsSocket();
			await connect();

			disconnect();
			await vi.advanceTimersByTimeAsync(60_000);

			expect(connectMock).toHaveBeenCalledOnce();
		});

		it('retries a first connect that fails', async () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			connectMock.mockRejectedValueOnce(new Error('down'));
			const { connect } = useChatsSocket();

			await connect();
			enterState('error');
			await vi.advanceTimersByTimeAsync(1_000);

			expect(connectMock).toHaveBeenCalledTimes(2);
		});
	});
});
