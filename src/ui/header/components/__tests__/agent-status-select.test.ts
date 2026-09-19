import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { PauseNotAllowedError } from 'webitel-sdk';

import { WebSocketConnectionState } from '../../../../app/api/socket/enums/WebSocketConnectionState.enum';

const onlineMock = vi.fn();
const pauseMock = vi.fn();
const offlineMock = vi.fn();

const agent = ref();
const socketState = ref<WebSocketConnectionState>(
	WebSocketConnectionState.Connected,
);

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		agent,
		state: socketState,
		getAgentSession: vi.fn(),
	}),
}));

vi.mock('@vueuse/core', () => ({
	useNow: () => ref(NOW),
}));

const {
	NOW,
	getPauseCausesMock,
	WtStatusSelect,
	WtCcActivityTypePopup,
	WtCcPauseCausePopup,
	WtCcStatusSelectErrorPopup,
} = vi.hoisted(() => {
	const stub = (name: string, props: string[]) => ({
		name,
		props,
		template: '<div />',
	});

	return {
		NOW: new Date('2026-09-19T12:00:00.000Z'),
		getPauseCausesMock: vi.fn(),
		WtStatusSelect: stub('WtStatusSelect', [
			'status',
			'statusDuration',
			'disabled',
		]),
		WtCcActivityTypePopup: stub('WtCcActivityTypePopup', [
			'options',
		]),
		WtCcPauseCausePopup: stub('WtCcPauseCausePopup', [
			'options',
		]),
		WtCcStatusSelectErrorPopup: stub('WtCcStatusSelectErrorPopup', [
			'error',
		]),
	};
});

vi.mock('@webitel/ui-sdk/components', () => ({
	WtStatusSelect,
}));

const loadActivityTypesMock = vi.fn();
const activityTypes = ref([]);

vi.mock('@webitel/ui-sdk/modules/AgentStatusSelect', () => ({
	PauseCauseAPI: {
		getList: getPauseCausesMock,
	},
	useActivityTypesOptions: () => ({
		activityTypes,
		loadActivityTypes: loadActivityTypesMock,
	}),
	WtCcActivityTypePopup,
	WtCcPauseCausePopup,
	WtCcStatusSelectErrorPopup,
}));

import AgentStatusSelect from '../agent-status-select.vue';

const agentSession = (over = {}) => ({
	agentId: 42,
	status: 'offline',
	lastStatusChange: NOW.getTime(),
	online: onlineMock,
	pause: pauseMock,
	offline: offlineMock,
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
	wrapper.findComponent(WtStatusSelect);

/** Drives the status dropdown the way a user picking an option would. */
async function pick(
	wrapper: ReturnType<typeof mountSelect>,
	status: string,
): Promise<void> {
	select(wrapper).vm.$emit('change', status);
	await flushPromises();
}

describe('agent-status-select', () => {
	beforeEach(() => {
		onlineMock.mockReset();
		pauseMock.mockReset().mockResolvedValue({});
		offlineMock.mockReset();
		getPauseCausesMock.mockReset().mockResolvedValue({
			items: [],
		});
		loadActivityTypesMock.mockReset();
		activityTypes.value = [];
		agent.value = agentSession();
		socketState.value = WebSocketConnectionState.Connected;
	});

	describe('what the dropdown shows', () => {
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

	describe('going online', () => {
		it('goes straight online when there is nothing to choose between', async () => {
			activityTypes.value = [
				{
					id: '1',
					name: 'Standard',
				},
			];
			const wrapper = mountSelect();

			await pick(wrapper, 'online');

			expect(loadActivityTypesMock).toHaveBeenCalled();
			expect(onlineMock).toHaveBeenCalledWith(undefined, undefined, undefined);
			expect(wrapper.findComponent(WtCcActivityTypePopup).exists()).toBe(false);
		});

		it('asks which activity type when there is more than one', async () => {
			activityTypes.value = [
				{
					id: '1',
					name: 'Standard',
				},
				{
					id: '2',
					name: 'Support',
				},
			];
			const wrapper = mountSelect();

			await pick(wrapper, 'online');

			expect(wrapper.findComponent(WtCcActivityTypePopup).exists()).toBe(true);
			expect(onlineMock).not.toHaveBeenCalled();
		});

		it('goes online with the activity type the agent picked', async () => {
			const support = {
				id: '2',
				name: 'Support',
			};
			activityTypes.value = [
				{
					id: '1',
					name: 'Standard',
				},
				support,
			];
			const wrapper = mountSelect();
			await pick(wrapper, 'online');

			wrapper.findComponent(WtCcActivityTypePopup).vm.$emit('change', support);
			await flushPromises();

			expect(onlineMock).toHaveBeenCalledWith(undefined, undefined, support);
		});

		it('stays put when the agent closes the activity type popup', async () => {
			activityTypes.value = [
				{
					id: '1',
					name: 'Standard',
				},
				{
					id: '2',
					name: 'Support',
				},
			];
			const wrapper = mountSelect();
			await pick(wrapper, 'online');

			wrapper.findComponent(WtCcActivityTypePopup).vm.$emit('close');
			await flushPromises();

			expect(wrapper.findComponent(WtCcActivityTypePopup).exists()).toBe(false);
			expect(onlineMock).not.toHaveBeenCalled();
		});
	});

	describe('pausing', () => {
		it('pauses without asking when the agent has no pause causes', async () => {
			const wrapper = mountSelect();

			await pick(wrapper, 'pause');

			expect(getPauseCausesMock).toHaveBeenCalledWith({
				agentId: 42,
			});
			expect(pauseMock).toHaveBeenCalledWith();
			expect(wrapper.findComponent(WtCcPauseCausePopup).exists()).toBe(false);
		});

		it('asks for a cause when the agent has some', async () => {
			getPauseCausesMock.mockResolvedValue({
				items: [
					{
						id: '1',
						name: 'Dinner',
					},
				],
			});
			const wrapper = mountSelect();

			await pick(wrapper, 'pause');

			expect(wrapper.findComponent(WtCcPauseCausePopup).exists()).toBe(true);
			expect(pauseMock).not.toHaveBeenCalled();
		});

		it('pauses with the cause and comment the agent gave', async () => {
			getPauseCausesMock.mockResolvedValue({
				items: [
					{
						id: '1',
						name: 'Dinner',
					},
				],
			});
			const wrapper = mountSelect();
			await pick(wrapper, 'pause');

			wrapper.findComponent(WtCcPauseCausePopup).vm.$emit('change', {
				pauseCause: 'Dinner',
				statusComment: 'back in 20',
			});
			await flushPromises();

			expect(pauseMock).toHaveBeenCalledWith({
				status_payload: 'Dinner',
				status_comment: 'back in 20',
			});
		});

		it('tells the agent when the server refuses the pause', async () => {
			pauseMock.mockResolvedValue(new PauseNotAllowedError('limit reached'));
			const wrapper = mountSelect();

			await pick(wrapper, 'pause');
			await flushPromises();

			expect(wrapper.findComponent(WtCcStatusSelectErrorPopup).exists()).toBe(
				true,
			);
		});
	});

	describe('going offline', () => {
		it('takes the agent offline without asking anything', async () => {
			const wrapper = mountSelect();

			await pick(wrapper, 'offline');

			expect(offlineMock).toHaveBeenCalled();
			expect(wrapper.findComponent(WtCcPauseCausePopup).exists()).toBe(false);
		});
	});
});
