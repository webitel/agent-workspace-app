import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import TaskDockItemWrapper from '../task-dock-item-wrapper.vue';

describe('task-dock-item-wrapper', () => {
	it('renders slot content only while expanded', async () => {
		const wrapper = mount(TaskDockItemWrapper, {
			props: {
				label: 'Call 1',
				expanded: false,
			},
			slots: {
				default: 'Call body',
			},
		});

		expect(wrapper.find('.task-dock-item-wrapper__body').exists()).toBe(false);

		await wrapper.setProps({
			expanded: true,
		});

		expect(wrapper.find('.task-dock-item-wrapper__body').text()).toBe(
			'Call body',
		);
	});

	it('emits click when collapsible', async () => {
		const wrapper = mount(TaskDockItemWrapper, {
			props: {
				label: 'Call 1',
				collapsible: true,
			},
		});

		await wrapper.trigger('click');

		expect(wrapper.emitted('click')).toHaveLength(1);
	});

	it('ignores click when not collapsible', async () => {
		const wrapper = mount(TaskDockItemWrapper, {
			props: {
				label: 'Numpad',
				expanded: true,
				collapsible: false,
			},
		});

		await wrapper.trigger('click');

		expect(wrapper.emitted('click')).toBeUndefined();
	});
});
