import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { useTaskDockStore } from '../../store/task-dock';
import TaskDockCallLane from '../task-dock-call-lane.vue';

function mountCallLane() {
	return mount(TaskDockCallLane, {
		global: {
			plugins: [
				createTestingPinia({
					stubActions: false,
				}),
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

	it('keeps numpad always expanded and non-interactive', async () => {
		const wrapper = mountCallLane();
		const store = useTaskDockStore();
		const numpad = wrapper
			.findAll('.task-dock-item-wrapper')
			.find((item) => item.text().includes('Numpad'));

		expect(numpad?.classes()).toContain('task-dock-item-wrapper--expanded');
		expect(numpad?.classes()).not.toContain(
			'task-dock-item-wrapper--collapsible',
		);

		await numpad?.trigger('click');

		expect(store.expandedCallId).toBeNull();
	});
});
