import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { WebSocketConnectionState } from '../../../../app/api/socket/enums/WebSocketConnectionState.enum';

const agent = ref();
const socketState = ref<WebSocketConnectionState>(
	WebSocketConnectionState.Connected,
);

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		agent,
		state: socketState,
		getAgentSession: vi.fn(),
		getClient: () => ({
			subscribeAgentsStatus: vi.fn(),
		}),
	}),
}));

const { NOW, WtCcAgentStatusSelect } = vi.hoisted(() => ({
	NOW: new Date('2026-09-21T12:00:00.000Z'),
	WtCcAgentStatusSelect: {
		name: 'WtCcAgentStatusSelect',
		props: [
			'agentId',
			'status',
			'statusDuration',
			'disabled',
		],
		template: '<div />',
	},
}));

vi.mock('@vueuse/core', () => ({
	useNow: () => ref(NOW),
}));

vi.mock('@webitel/ui-sdk/modules/AgentStatusSelect', () => ({
	WtCcAgentStatusSelect,
}));

import AgentStatusSelect from '../agent-status-select.vue';

const agentSession = (over = {}) => ({
	agentId: 42,
	status: 'offline',
	lastStatusChange: NOW.getTime(),
	...over,
});

function mountSelect() {
	return mount(AgentStatusSelect, {
		global: {
			plugins: [
				createTestingPinia({
					stubActions: false,
				}),
			],
		},
	});
}

const select = (wrapper: ReturnType<typeof mountSelect>) =>
	wrapper.findComponent(WtCcAgentStatusSelect);

describe('agent-status-select', () => {
	beforeEach(() => {
		agent.value = agentSession();
		socketState.value = WebSocketConnectionState.Connected;
	});

	it('hands the SDK select the agent it should act on', () => {
		expect(select(mountSelect()).props('agentId')).toBe(42);
	});

	it('shows the status held by the agent session', () => {
		agent.value = agentSession({
			status: 'pause',
		});

		expect(select(mountSelect()).props('status')).toBe('pause');
	});

	it('shows how long the agent has held that status', () => {
		agent.value = agentSession({
			lastStatusChange: NOW.getTime() - 65_000,
		});

		expect(select(mountSelect()).props('statusDuration')).toBe('00:01:05');
	});

	it('is enabled while the socket is connected and the session is live', () => {
		expect(select(mountSelect()).props('disabled')).toBe(false);
	});

	it('is disabled while the socket is not connected', () => {
		socketState.value = WebSocketConnectionState.Reconnecting;

		expect(select(mountSelect()).props('disabled')).toBe(true);
	});

	it('is disabled when there is no agent session', () => {
		agent.value = undefined;

		expect(select(mountSelect()).props('disabled')).toBe(true);
	});
});
