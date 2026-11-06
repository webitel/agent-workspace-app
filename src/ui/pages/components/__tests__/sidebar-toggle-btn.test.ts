import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { useWorkspaceSidebarStore } from '../../../sidebar/store/workspace-sidebar';
import SidebarToggleBtn from '../sidebar-toggle-btn.vue';

// wt-icon-btn is registered globally by ui-sdk, so the test supplies it
const stubs = {
	'wt-icon-btn': {
		name: 'WtIconBtn',
		props: [
			'icon',
		],
		emits: [
			'click',
		],
		template: '<button @click="$emit(\'click\')" />',
	},
};

const mountBtn = (isOpen: boolean) =>
	mount(SidebarToggleBtn, {
		global: {
			stubs,
			plugins: [
				createTestingPinia({
					initialState: {
						sidebar: {
							isOpen,
						},
					},
				}),
			],
		},
	});

describe('sidebar-toggle-btn', () => {
	it('shows the open icon while the sidebar is open', () => {
		const wrapper = mountBtn(true);

		expect(
			wrapper
				.findComponent({
					name: 'WtIconBtn',
				})
				.props('icon'),
		).toBe('ws-sidebar-open');
	});

	it('shows the closed icon while the sidebar is closed', () => {
		const wrapper = mountBtn(false);

		expect(
			wrapper
				.findComponent({
					name: 'WtIconBtn',
				})
				.props('icon'),
		).toBe('ws-sidebar-close');
	});

	it('toggles the sidebar on click', async () => {
		const wrapper = mountBtn(false);

		await wrapper.find('button').trigger('click');

		expect(useWorkspaceSidebarStore().toggle).toHaveBeenCalledTimes(1);
	});
});
