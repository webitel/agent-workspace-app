import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import WebitelUI from '@webitel/ui-sdk';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { describe, expect, it } from 'vitest';

import { useNumpadStore } from '../../../numpad/store/numpad';
import { useTaskDockStore } from '../../store/task-dock';
import TaskDockCallLane from '../task-dock-call-lane.vue';

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
	function collapsibleItems(wrapper: ReturnType<typeof mountCallLane>) {
		return wrapper.findAll('.task-dock-item-wrapper--collapsible');
	}

	it('expands one call at a time when items are clicked', async () => {
		const wrapper = mountCallLane();
		const store = useTaskDockStore();
		const [firstCall, secondCall] = collapsibleItems(wrapper);

		await firstCall.trigger('click');
		expect(store.expandedCallId).toBe('call-1');
		expect(firstCall.classes()).toContain('task-dock-item-wrapper--expanded');

		await secondCall.trigger('click');
		expect(store.expandedCallId).toBe('call-2');
		expect(firstCall.classes()).not.toContain(
			'task-dock-item-wrapper--expanded',
		);
		expect(secondCall.classes()).toContain('task-dock-item-wrapper--expanded');

		await secondCall.trigger('click');
		expect(store.expandedCallId).toBeNull();
	});

	it('shows the numpad only once the numpad store is opened', async () => {
		const wrapper = mountCallLane();
		const numpadStore = useNumpadStore();

		expect(wrapper.find('.the-dialer-panel').exists()).toBe(false);

		numpadStore.open();
		await wrapper.vm.$nextTick();

		expect(wrapper.find('.the-dialer-panel').exists()).toBe(true);
	});
});
