import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const connectMock = vi.fn();
const disconnectMock = vi.fn();
// Captures the SDK-level ThreadMessage callback so tests can emit an event.
let sdkMessageHandler: ((data: unknown) => void) | null = null;
const onMessageMock = vi.fn((_event: string, cb: (data: unknown) => void) => {
	sdkMessageHandler = cb;
});

const createChatsSocketClientMock = vi.fn((..._args: unknown[]) => ({
	connect: connectMock,
	disconnect: disconnectMock,
	onMessage: onMessageMock,
}));
const createSocketConfigMock = vi.fn((...args: unknown[]) => args[0]);

vi.mock('@webitel/chat-web-sdk', () => ({
	ChatsSocketMessage: {
		ThreadMessage: 'messageEvent',
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
});
