import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import WebitelUI from '@webitel/ui-sdk';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { describe, expect, it } from 'vitest';

import { useNumpadStore } from '../../store/numpad';
import TheNumpadPanel from '../the-numpad-panel.vue';

function mountPanel() {
	return mount(TheNumpadPanel, {
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

describe('the-numpad-panel', () => {
	it('is hidden until the numpad store is opened', () => {
		const wrapper = mountPanel();

		expect(wrapper.find('.the-numpad-panel').exists()).toBe(false);
	});

	it('shows the numpad once opened', async () => {
		const wrapper = mountPanel();
		const numpadStore = useNumpadStore();

		numpadStore.open();
		await wrapper.vm.$nextTick();

		expect(wrapper.find('.the-numpad-panel').exists()).toBe(true);
		expect(
			wrapper
				.findComponent({
					name: 'TheNumpad',
				})
				.exists(),
		).toBe(true);
	});

	it('prefills the number the numpad store was opened with', async () => {
		const wrapper = mountPanel();
		const numpadStore = useNumpadStore();

		numpadStore.open('0671234567');
		await wrapper.vm.$nextTick();

		expect(wrapper.find('input').element.value).toBe('0671234567');
	});

	it('closes the panel once a call is placed', async () => {
		const wrapper = mountPanel();
		const numpadStore = useNumpadStore();

		numpadStore.open();
		await wrapper.vm.$nextTick();

		await wrapper.find('input').setValue('123');
		await wrapper
			.findAll('button')
			.find((button) => button.text() === 'ui.numpad.call')
			?.trigger('click');

		expect(numpadStore.close).toHaveBeenCalled();
	});
});
