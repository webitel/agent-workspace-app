import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { useTaskDockStore } from '../../store/task-dock';
import TaskDockChatLane from '../task-dock-chat-lane.vue';

describe('task-dock-chat-lane', () => {
	it('expands one chat at a time when items are clicked', async () => {
		const wrapper = mount(TaskDockChatLane, {
			global: {
				plugins: [
					createTestingPinia({
						stubActions: false,
					}),
				],
			},
		});
		const store = useTaskDockStore();
		const [firstChat, secondChat] = wrapper.findAll(
			'.task-dock-item-wrapper--collapsible',
		);

		await firstChat.trigger('click');
		expect(store.expandedChatId).toBe('chat-1');
		expect(firstChat.classes()).toContain('task-dock-item-wrapper--expanded');

		await secondChat.trigger('click');
		expect(store.expandedChatId).toBe('chat-2');
		expect(firstChat.classes()).not.toContain(
			'task-dock-item-wrapper--expanded',
		);
		expect(secondChat.classes()).toContain('task-dock-item-wrapper--expanded');
	});
});
