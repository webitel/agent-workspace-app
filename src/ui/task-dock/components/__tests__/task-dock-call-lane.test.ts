import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import WebitelUI from '@webitel/ui-sdk';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type { Call } from 'webitel-sdk';

import { useNumpadStore } from '../../../numpad/store/numpad';
import TaskDockCallLane from '../task-dock-call-lane.vue';

const calls = ref<Call[]>([]);

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
	});

	it('shows a bar for each active call and none for a call still ringing', () => {
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

		expect(wrapper.findAll('.floating-call-widget')).toHaveLength(2);
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
