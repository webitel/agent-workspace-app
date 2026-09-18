import { mount } from '@vue/test-utils';
import WebitelUI from '@webitel/ui-sdk';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';

import SidebarMenuButton from '../sidebar-menu-button.vue';

function mountButton(props: InstanceType<typeof SidebarMenuButton>['$props']) {
	const router = createRouter({
		history: createWebHistory(),
		routes: [
			{
				path: '/calls',
				component: {
					template: '<div />',
				},
			},
		],
	});

	return mount(SidebarMenuButton, {
		props,
		global: {
			plugins: [
				router,
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

describe('sidebar-menu-button', () => {
	it('renders a route link when `to` is given', () => {
		const wrapper = mountButton({
			to: '/calls',
			icon: 'call',
		});

		expect(
			wrapper
				.findComponent({
					name: 'RouterLink',
				})
				.exists(),
		).toBe(true);
	});

	it('renders a plain action button and emits `click` when `to` is not given', async () => {
		const wrapper = mountButton({
			icon: 'call',
		});

		expect(
			wrapper
				.findComponent({
					name: 'RouterLink',
				})
				.exists(),
		).toBe(false);

		await wrapper.find('button').trigger('click');

		expect(wrapper.emitted('click')).toHaveLength(1);
	});
});
