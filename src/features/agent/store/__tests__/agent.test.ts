import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

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
	...over,
});

describe('useAgentStore', () => {
	beforeEach(() => {
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

	describe('initializeAgent', () => {
		it('opens the agent session', async () => {
			const store = useAgentStore();

			await store.initializeAgent();

			expect(getAgentSessionMock).toHaveBeenCalled();
		});

		/*
		 * Status is written over REST but read off the websocket session, and
		 * without cc_agent_subscribe_status the server pushes no agent_status
		 * frames — so the status would stay frozen at whatever the session opened
		 * with, including after this app's own writes.
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
