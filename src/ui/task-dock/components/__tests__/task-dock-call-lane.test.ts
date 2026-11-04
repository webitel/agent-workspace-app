import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import WebitelUI from '@webitel/ui-sdk';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type { Call } from 'webitel-sdk';

import { useNumpadStore } from '../../../numpad/store/numpad';
import { useTaskDockStore } from '../../store/task-dock';
import TaskDockCallLane from '../task-dock-call-lane.vue';

const calls = ref<Call[]>([]);
const push = vi.fn();

vi.mock('vue-router', () => ({
	useRouter: () => ({
		push,
	}),
}));

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		calls,
		getClient: () => ({}),
	}),
}));

/**
 * @author Oleksandr Palonnyi
 * the lane mounts the numpad panel, which reaches the calls store and its
 * `app/locale/i18n` singleton, so the singleton is replaced here rather than
 * `createI18n` being stubbed for every suite in `test/setup.ts`
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
// the calls store takes the agent to a call's window; the app's routes would
// pull every page in
vi.mock('../../../../app/router', () => ({
	router: null,
}));

vi.mock('../../../../app/locale/i18n', () => ({
	default: {
		global: {
			t: (key: string) => key,
		},
	},
}));

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		id: 'call-1',
		displayName: 'Emily Johnson',
		displayNumber: '+12023417842',
		hideContact: false,
		hideNumber: false,
		queue: null,
		answeredAt: Date.now(),
		hangupAt: 0,
		isHold: false,
		muted: false,
		...overrides,
	}) as unknown as Call;

function mountCallLane() {
	return mount(TaskDockCallLane, {
		global: {
			plugins: [
				createTestingPinia({
					stubActions: false,
				}),
				[
					WebitelUI,
					{
						eventBus,
					},
				],
			],
		},
	});
}

describe('task-dock-call-lane', () => {
	beforeEach(() => {
		calls.value = [];
		push.mockClear();
	});

	it('shows a tray entry for each active call and none for a call still ringing', () => {
		calls.value = [
			buildCall({
				id: 'call-1',
			}),
			buildCall({
				id: 'call-2',
			}),
			buildCall({
				id: 'ringing',
				answeredAt: 0,
			}),
		];

		const wrapper = mountCallLane();

		expect(wrapper.findAll('.active-call-tray-entry')).toHaveLength(2);
	});

	it('expands the tray entry that is clicked and collapses it on the next click', async () => {
		calls.value = [
			buildCall(),
		];
		const wrapper = mountCallLane();
		const store = useTaskDockStore();

		await wrapper.find('.floating-call-widget').trigger('click');
		expect(store.expandedCallId).toBe('call-1');
		expect(wrapper.find('.call-dock').exists()).toBe(true);

		await wrapper.find('.floating-call-widget').trigger('click');
		expect(store.expandedCallId).toBeNull();
	});

	describe('expanded dock actions', () => {
		const expandDock = async (wrapper: ReturnType<typeof mountCallLane>) => {
			await wrapper.find('.floating-call-widget').trigger('click');
		};

		const findAction = (
			wrapper: ReturnType<typeof mountCallLane>,
			name: string,
		) => wrapper.find(`[aria-label="ui.call.activeCall.actions.${name}"]`);

		it('toggles hold on the call', async () => {
			const call = buildCall({
				allowHold: true,
				toggleHold: vi.fn(),
			} as Partial<Call>);
			calls.value = [
				call,
			];
			const wrapper = mountCallLane();
			await expandDock(wrapper);

			await findAction(wrapper, 'hold').trigger('click');

			expect(call.toggleHold).toHaveBeenCalledTimes(1);
		});

		it('hangs up the call and collapses the dock', async () => {
			const call = buildCall({
				allowHangup: true,
				hangup: vi.fn(),
			} as Partial<Call>);
			calls.value = [
				call,
			];
			const wrapper = mountCallLane();
			const store = useTaskDockStore();
			await expandDock(wrapper);

			await findAction(wrapper, 'hangup').trigger('click');

			expect(call.hangup).toHaveBeenCalledTimes(1);
			expect(store.expandedCallId).toBeNull();
		});

		it('sends the digit of a numpad key on the call', async () => {
			const call = buildCall({
				allowDtmf: true,
				sendDTMF: vi.fn(),
			} as Partial<Call>);
			calls.value = [
				call,
			];
			const wrapper = mountCallLane();
			await expandDock(wrapper);
			await findAction(wrapper, 'numpad').trigger('click');

			const key = wrapper
				.findAll('.numpad-keys__key')
				.find((candidate) => candidate.text() === '5');
			await key?.trigger('click');

			expect(call.sendDTMF).toHaveBeenCalledWith('5');
		});
	});

	describe('call windows', () => {
		const inPostProcessing = () =>
			buildCall({
				id: 'ended',
				hangupAt: Date.now(),
				task: {
					id: 7,
					state: 'processing',
					processingTimeoutAt: Date.now() + 65_500,
				},
			} as Partial<Call>);

		it('keeps an ended call in post-processing as a widget with its time left', () => {
			calls.value = [
				inPostProcessing(),
			];

			const wrapper = mountCallLane();

			expect(wrapper.find('.post-processing-call-bar').exists()).toBe(true);
			expect(wrapper.find('.floating-call-widget__timer').text()).toBe('01:05');
		});

		it('leaves out an ended call that has no task left', () => {
			calls.value = [
				buildCall({
					hangupAt: Date.now(),
				}),
			];

			const wrapper = mountCallLane();

			expect(wrapper.find('.floating-call-widget').exists()).toBe(false);
		});

		it('leads from the post-processing widget back to its Call window', async () => {
			calls.value = [
				inPostProcessing(),
			];
			const wrapper = mountCallLane();

			await wrapper.find('.post-processing-call-bar').trigger('click');

			expect(push).toHaveBeenCalledWith({
				name: 'call-window',
				params: {
					callId: 'ended',
				},
			});
		});

		it('opens the Call window from the open-full-view button of an active call', async () => {
			calls.value = [
				buildCall(),
			];
			const wrapper = mountCallLane();

			await wrapper
				.find(
					'.floating-call-widget [aria-label="ui.call.activeCall.actions.openFullView"]',
				)
				.trigger('click');

			expect(push).toHaveBeenCalledTimes(1);
			expect(push).toHaveBeenCalledWith({
				name: 'call-window',
				params: {
					callId: 'call-1',
				},
			});
		});
	});

	it('shows the numpad only once the numpad store is opened', async () => {
		const wrapper = mountCallLane();
		const numpadStore = useNumpadStore();

		expect(wrapper.find('.the-numpad-panel').exists()).toBe(false);

		numpadStore.open();
		await wrapper.vm.$nextTick();

		expect(wrapper.find('.the-numpad-panel').exists()).toBe(true);
	});
});
