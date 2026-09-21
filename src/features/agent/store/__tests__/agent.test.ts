import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { PauseNotAllowedError } from 'webitel-sdk';

const onlineMock = vi.fn();
const pauseMock = vi.fn();
const offlineMock = vi.fn();
const getAgentSessionMock = vi.fn();
const subscribeAgentsStatusMock = vi.fn();

const agent = ref();

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		agent,
		getAgentSession: getAgentSessionMock,
		getClient: () => ({
			subscribeAgentsStatus: subscribeAgentsStatusMock,
		}),
	}),
}));

import { useAgentStore } from '../agent';

const agentSession = (over = {}) => ({
	agentId: 42,
	status: 'offline',
	lastStatusChange: 1_700_000_000_000,
	online: onlineMock,
	pause: pauseMock,
	offline: offlineMock,
	...over,
});

describe('useAgentStore', () => {
	beforeEach(() => {
		onlineMock.mockReset();
		pauseMock.mockReset();
		offlineMock.mockReset();
		getAgentSessionMock.mockReset();
		subscribeAgentsStatusMock.mockReset();
		agent.value = agentSession();
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
	});

	describe('session state', () => {
		it('exposes agentId, status and lastStatusChange from the websocket session', () => {
			const store = useAgentStore();

			expect(store.agentId).toBe(42);
			expect(store.status).toBe('offline');
			expect(store.lastStatusChange).toBe(1_700_000_000_000);
		});

		it('tracks status changes pushed onto the session', () => {
			const store = useAgentStore();

			agent.value = agentSession({
				status: 'online',
			});

			expect(store.status).toBe('online');
		});

		it('reports no status while the agent session is absent', () => {
			agent.value = undefined;
			const store = useAgentStore();

			expect(store.status).toBeUndefined();
			expect(store.agentId).toBeUndefined();
		});
	});

	describe('setAgentWaitingStatus', () => {
		it('goes online without an activity type when none is picked', async () => {
			const store = useAgentStore();

			await store.setAgentWaitingStatus();

			expect(onlineMock).toHaveBeenCalledWith(undefined, undefined, undefined);
		});

		it('passes the picked activity type as the online skill', async () => {
			const store = useAgentStore();
			const activityType = {
				id: '7',
				name: 'Support',
			};

			await store.setAgentWaitingStatus(activityType);

			expect(onlineMock).toHaveBeenCalledWith(
				undefined,
				undefined,
				activityType,
			);
		});

		it('flags the agent as removed when the server rejects the login', async () => {
			onlineMock.mockRejectedValue({
				id: 'app.agent.login.app_err',
			});
			const store = useAgentStore();

			await store.setAgentWaitingStatus();

			expect(store.isAgentRemoved).toBe(true);
		});

		it('rethrows errors that are not a removed agent', async () => {
			onlineMock.mockRejectedValue({
				id: 'app.agent.some_other_err',
			});
			const store = useAgentStore();

			await expect(store.setAgentWaitingStatus()).rejects.toEqual({
				id: 'app.agent.some_other_err',
			});
			expect(store.isAgentRemoved).toBe(false);
		});
	});

	describe('setAgentPauseStatus', () => {
		it('sends the cause and comment as the pause payload', async () => {
			const store = useAgentStore();

			await store.setAgentPauseStatus({
				cause: 'Dinner',
				comment: 'back in 20',
			});

			expect(pauseMock).toHaveBeenCalledWith({
				status_payload: 'Dinner',
				status_comment: 'back in 20',
			});
		});

		it('pauses without a payload when no cause was picked', async () => {
			const store = useAgentStore();

			await store.setAgentPauseStatus();

			expect(pauseMock).toHaveBeenCalledWith();
		});

		it('returns the error when the server does not allow pausing', async () => {
			const notAllowed = new PauseNotAllowedError('limit reached');
			pauseMock.mockResolvedValue(notAllowed);
			const store = useAgentStore();

			await expect(store.setAgentPauseStatus()).resolves.toBe(notAllowed);
		});

		it('resolves with nothing on a successful pause', async () => {
			pauseMock.mockResolvedValue({
				status: 'pause',
			});
			const store = useAgentStore();

			await expect(store.setAgentPauseStatus()).resolves.toBeUndefined();
		});
	});

	describe('setAgentOfflineStatus', () => {
		it('takes the agent offline', async () => {
			const store = useAgentStore();

			await store.setAgentOfflineStatus();

			expect(offlineMock).toHaveBeenCalled();
		});
	});

	describe('initializeAgent', () => {
		it('opens the agent session', async () => {
			const store = useAgentStore();

			await store.initializeAgent();

			expect(getAgentSessionMock).toHaveBeenCalled();
		});

		/*
		 * Without cc_agent_subscribe_status the server pushes no agent_status
		 * frames at all, so the session's status stays frozen at whatever it held
		 * when the session opened — including after this app's own writes.
		 */
		it('subscribes to this agent status changes', async () => {
			const store = useAgentStore();

			await store.initializeAgent();

			expect(subscribeAgentsStatusMock).toHaveBeenCalledWith(
				expect.any(Function),
				{
					agent_id: 42,
				},
			);
		});

		it('does not subscribe when there is no agent session', async () => {
			agent.value = undefined;
			const store = useAgentStore();

			await store.initializeAgent();

			expect(subscribeAgentsStatusMock).not.toHaveBeenCalled();
		});
	});
});
