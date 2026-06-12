import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockEmit as emitMock, mockTe } from '../../../../../test/setup';

const onMock = vi.fn();

// eventBus + vue-i18n are mocked globally in src/test/setup.ts

vi.mock('../../../../app/api/socket/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		on: onMock,
	}),
}));

import { useSocketNotifications } from '../useSocketNotifications';

describe('useSocketNotifications', () => {
	beforeEach(() => {
		onMock.mockClear();
	});

	it('subscribes to the WebSocket Error event', () => {
		const { subscribeToWebSocketEvents } = useSocketNotifications();

		subscribeToWebSocketEvents();

		expect(onMock).toHaveBeenCalledWith('error', expect.any(Function));
	});

	it('emits a localized notification when the error id has a translation', () => {
		// global mock: te defaults to true, t echoes the key
		const { subscribeToWebSocketEvents } = useSocketNotifications();
		subscribeToWebSocketEvents();

		const handler = onMock.mock.calls[0][1] as (e: unknown) => void;
		const error = Object.assign(new Error('boom'), {
			id: 'auth.failed',
		});
		handler(error);

		// dots in id replaced with underscores for the locale key
		expect(mockTe).toHaveBeenCalledWith('error.websocket.auth_failed');
		expect(emitMock).toHaveBeenCalledWith('notification', {
			type: 'error',
			text: 'error.websocket.auth_failed',
		});
	});

	it('falls back to the raw error when no translation exists', () => {
		mockTe.mockReturnValue(false);
		const { subscribeToWebSocketEvents } = useSocketNotifications();
		subscribeToWebSocketEvents();

		const handler = onMock.mock.calls[0][1] as (e: unknown) => void;
		const error = Object.assign(new Error('boom'), {
			id: 'auth.failed',
		});
		handler(error);

		expect(emitMock).toHaveBeenCalledWith('notification', {
			type: 'error',
			text: error,
		});
	});

	it('falls back to the raw error when the error has no id', () => {
		const { subscribeToWebSocketEvents } = useSocketNotifications();
		subscribeToWebSocketEvents();

		const handler = onMock.mock.calls[0][1] as (e: unknown) => void;
		const error = new Error('boom');
		handler(error);

		// no id => no locale key => te never consulted
		expect(mockTe).not.toHaveBeenCalled();
		expect(emitMock).toHaveBeenCalledWith('notification', {
			type: 'error',
			text: error,
		});
	});
});
