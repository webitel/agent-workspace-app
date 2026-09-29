import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import WebitelUI from '@webitel/ui-sdk';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { describe, expect, it, vi } from 'vitest';

import { useNumpadStore } from '../../store/numpad';
import TheNumpadPanel from '../the-numpad-panel.vue';

/**
 * @author Oleksandr Palonnyi
 * The calls store is replaced by its public surface: dialling is
 * covered by its own suite, here only the hand-off from the numpad matters
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
const callsStore = {
	call: vi.fn(async (_destination: string) => true),
};

vi.mock('../../../../features/calls/store/calls', () => ({
	useCallsStore: () => callsStore,
}));

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

async function placeCallFromNumpad(
	wrapper: ReturnType<typeof mountPanel>,
	destination: string,
) {
	useNumpadStore().open();
	await wrapper.vm.$nextTick();

	await wrapper.find('input').setValue(destination);
	await wrapper
		.findAll('button')
		.find((button) => button.text() === 'ui.numpad.call')
		?.trigger('click');
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

	it('dials the entered number when a call is placed', async () => {
		const wrapper = mountPanel();

		await placeCallFromNumpad(wrapper, '0671234567');

		expect(callsStore.call).toHaveBeenCalledWith('0671234567');
	});

	it('closes the panel once a call is placed', async () => {
		const wrapper = mountPanel();

		await placeCallFromNumpad(wrapper, '123');

		expect(useNumpadStore().close).toHaveBeenCalled();
	});
});
