import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const subscribeTaskMock = vi.fn();
const getClientMock = vi.fn(() => ({
	subscribeTask: subscribeTaskMock,
}));

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		getClient: getClientMock,
	}),
}));

import { useChatsStore } from '../chats';

describe('chats store', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		subscribeTaskMock.mockClear();
		getClientMock.mockClear();
	});

	it('subscribes to tasks on the connected client on initialize', () => {
		const store = useChatsStore();

		store.initialize();

		expect(subscribeTaskMock).toHaveBeenCalledOnce();
		expect(subscribeTaskMock).toHaveBeenCalledWith(expect.any(Function));
	});
});
