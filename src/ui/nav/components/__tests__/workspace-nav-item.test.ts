import { mount } from '@vue/test-utils';
import WebitelUI from '@webitel/ui-sdk';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { describe, expect, it, vi } from 'vitest';

import WorkspaceNavItem from '../workspace-nav-item.vue';

describe('workspace-nav-item', () => {
	it('runs the action of a button item on click', async () => {
		const onClick = vi.fn();
		const wrapper = mount(WorkspaceNavItem, {
			props: {
				item: {
					kind: 'button',
					icon: 'ws-navigation-calls',
					onClick,
				},
			},
			global: {
				plugins: [
					[
						WebitelUI,
						{
							eventBus,
						},
					],
				],
			},
		});

		await wrapper.find('button').trigger('click');

		expect(onClick).toHaveBeenCalledOnce();
	});
});
