import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const connectMock = vi.fn();
const disconnectMock = vi.fn();
// Captures the SDK-level ThreadMessage callback so tests can emit an event.
let sdkMessageHandler: ((data: unknown) => void) | null = null;
let sdkTagsChangedHandler: ((data: unknown) => void) | null = null;
let sdkUnreadChangedHandler: ((data: unknown) => void) | null = null;
const onMessageMock = vi.fn((event: string, cb: (data: unknown) => void) => {
	if (event === 'messageEvent') sdkMessageHandler = cb;
	if (event === 'threadTagsChangedEvent') sdkTagsChangedHandler = cb;
	if (event === 'threadUnreadChangedEvent') sdkUnreadChangedHandler = cb;
});
// Captures the SDK's reconnected callback so tests can report a recovery.
let sdkReconnectedHandler: ((payload: { attempt: number }) => void) | null =
	null;
const onReconnectedMock = vi.fn(
	(callback: (payload: { attempt: number }) => void) => {
		sdkReconnectedHandler = callback;
	},
);

const createChatsSocketClientMock = vi.fn((..._args: unknown[]) => ({
	connect: connectMock,
	disconnect: disconnectMock,
	onMessage: onMessageMock,
	onReconnected: onReconnectedMock,
}));
const createSocketConfigMock = vi.fn((...args: unknown[]) => args[0]);

vi.mock('@webitel/chat-web-sdk', () => ({
	ChatsSocketMessage: {
		ThreadMessage: 'messageEvent',
		ThreadTagsChanged: 'threadTagsChangedEvent',
		ThreadUnreadChanged: 'threadUnreadChangedEvent',
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
		sdkTagsChangedHandler = null;
		sdkUnreadChangedHandler = null;
		sdkReconnectedHandler = null;
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

	it('connects a client built from env, serviceConfig and the browser network', async () => {
		const { connect } = useChatsSocket();

		await connect();

		expect(createSocketConfigMock).toHaveBeenCalledWith({
			baseUrl: 'wss://test.webitel.me/chat/ws',
			accessToken: expect.any(Function),
		});
		expect(createChatsSocketClientMock).toHaveBeenCalledWith({
			socketConfig: expect.objectContaining({
				baseUrl: 'wss://test.webitel.me/chat/ws',
			}),
			serviceConfig: {
				marker: 'service-config',
			},
			followBrowserNetwork: true,
		});
		expect(connectMock).toHaveBeenCalledOnce();
	});

	// the SDK reads the token on every attempt, so a reconnect uses the current one
	it('hands the SDK the token as it is when an attempt reads it', async () => {
		const { connect } = useChatsSocket();
		await connect();
		const { accessToken } = createSocketConfigMock.mock.calls[0][0] as {
			accessToken: () => string;
		};

		localStorage.setItem('access-token', 'tok-renewed');

		expect(accessToken()).toBe('tok-renewed');
	});

	it('does not create a second client while one is already connected', async () => {
		const { connect } = useChatsSocket();

		await connect();
		await connect();

		expect(createChatsSocketClientMock).toHaveBeenCalledOnce();
	});

	// the SDK keeps retrying a failed first connect; a second client would race it
	it('keeps the client when the first connect fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		connectMock.mockRejectedValueOnce(new Error('down'));
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

	it('hands a thread tags change to every registered handler', async () => {
		const { connect, onThreadTagsChanged } = useChatsSocket();
		await connect();
		const handler = vi.fn();
		const stop = onThreadTagsChanged(handler);

		const changed = {
			threadId: 'chat-1',
			tags: [
				'snoozed',
			],
			updatesCursor: 'c1',
		};
		sdkTagsChangedHandler?.(changed);
		stop();
		sdkTagsChangedHandler?.(changed);

		expect(handler).toHaveBeenCalledOnce();
		expect(handler).toHaveBeenCalledWith(changed);
	});

	it('hands a thread unread count change to every registered handler', async () => {
		const { connect, onThreadUnreadChanged } = useChatsSocket();
		await connect();
		const handler = vi.fn();
		const stop = onThreadUnreadChanged(handler);

		const changed = {
			threadId: 'chat-1',
			unreadCount: 3,
		};
		sdkUnreadChangedHandler?.(changed);
		stop();
		sdkUnreadChangedHandler?.(changed);

		expect(handler).toHaveBeenCalledOnce();
		expect(handler).toHaveBeenCalledWith(changed);
	});

	it('tells reconnect listeners once the SDK reports the socket is back', async () => {
		const reconnected = vi.fn();
		const { connect, onReconnected } = useChatsSocket();
		onReconnected(reconnected);
		await connect();

		sdkReconnectedHandler?.({
			attempt: 2,
		});

		expect(reconnected).toHaveBeenCalledOnce();
	});

	it('stops telling a listener that unsubscribed', async () => {
		const reconnected = vi.fn();
		const { connect, onReconnected } = useChatsSocket();
		const unsubscribe = onReconnected(reconnected);
		await connect();

		unsubscribe();
		sdkReconnectedHandler?.({
			attempt: 2,
		});

		expect(reconnected).not.toHaveBeenCalled();
	});

	it('releases the client on disconnect, so the next connect builds a new one', async () => {
		const { connect, disconnect } = useChatsSocket();
		await connect();

		disconnect();
		await connect();

		expect(disconnectMock).toHaveBeenCalledOnce();
		expect(createChatsSocketClientMock).toHaveBeenCalledTimes(2);
	});
});
