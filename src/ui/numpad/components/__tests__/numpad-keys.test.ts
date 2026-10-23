import { mount } from '@vue/test-utils';
import WebitelUI from '@webitel/ui-sdk';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { describe, expect, it } from 'vitest';

import { NUMPAD_KEYS } from '../../constants/numpadKeys';
import NumpadKeys from '../numpad-keys.vue';

function mountNumpadKeys() {
	return mount(NumpadKeys, {
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
}

describe('numpad-keys', () => {
	it('renders a button for every numpad key', () => {
		const wrapper = mountNumpadKeys();

		expect(wrapper.findAll('button').map((button) => button.text())).toEqual([
			...NUMPAD_KEYS,
		]);
	});

	it('includes the plus key of the dialer', () => {
		const wrapper = mountNumpadKeys();

		expect(wrapper.text()).toContain('+');
	});

	it('emits the digit of the clicked key', async () => {
		const wrapper = mountNumpadKeys();

		await wrapper
			.findAll('button')
			.find((button) => button.text() === '#')
			?.trigger('click');

		expect(wrapper.emitted('digit')).toEqual([
			[
				'#',
			],
		]);
	});
});
