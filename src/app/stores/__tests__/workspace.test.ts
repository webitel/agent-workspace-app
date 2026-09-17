import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useWorkspaceStore } from '../workspace';

const connect = vi.fn(async () => {});
const initializeAgent = vi.fn(async () => {});
const initializeChats = vi.fn(() => {});
const initializeGlobalHandlers = vi.fn(() => {});
const initializeUserStatus = vi.fn(async () => {});

vi.mock('../../api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		connect: () => connect(),
	}),
}));
vi.mock('../../../features/agent/store/agent', () => ({
	useAgentStore: () => ({
		initializeAgent: () => initializeAgent(),
	}),
}));
vi.mock('../../../features/chats/store/chats', () => ({
	useChatsStore: () => ({
		initialize: () => initializeChats(),
	}),
}));
vi.mock('../../../features/global-handlers/store/globalHandlers', () => ({
	useGlobalHandlersStore: () => ({
		initialize: () => initializeGlobalHandlers(),
	}),
}));
vi.mock('../../../features/user-status/store/userStatus', () => ({
	useUserStatusStore: () => ({
		initialize: () => initializeUserStatus(),
	}),
}));

describe('useWorkspaceStore', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
		connect.mockResolvedValue(undefined);
		initializeAgent.mockResolvedValue(undefined);
	});

	/**
	 * The SDK drops every channel event and returns an empty task list until the
	 * agent session exists, so the task-feed consumers must not start before it.
	 */
	it('connects, then resolves the agent session, then starts the chats coordinator', async () => {
		const order: string[] = [];

		connect.mockImplementation(async () => {
			order.push('connect');
		});
		initializeAgent.mockImplementation(async () => {
			order.push('agent');
		});
		initializeChats.mockImplementation(() => {
			order.push('chats');
		});

		await useWorkspaceStore().initialize();

		expect(order).toEqual([
			'connect',
			'agent',
			'chats',
		]);
	});

	/**
	 * A user without an agent — a supervisor or admin opening this app — must
	 * still get a working workspace. `main.ts` aborts the whole bootstrap,
	 * router included, on the first rejection.
	 */
	it('still starts the rest of the workspace when the agent session fails', async () => {
		initializeAgent.mockRejectedValue(new Error('no agent for this user'));

		await expect(useWorkspaceStore().initialize()).resolves.toBeUndefined();

		expect(initializeChats).toHaveBeenCalledTimes(1);
		expect(initializeGlobalHandlers).toHaveBeenCalledTimes(1);
		expect(initializeUserStatus).toHaveBeenCalledTimes(1);
	});

	it('does not resolve the agent session before the socket is connected', async () => {
		connect.mockRejectedValue(new Error('socket down'));

		await expect(useWorkspaceStore().initialize()).rejects.toThrow(
			'socket down',
		);

		expect(initializeAgent).not.toHaveBeenCalled();
	});
});
