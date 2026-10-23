import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import NumpadKeys from '../../../../../numpad/components/numpad-keys.vue';
import CallDockNumpad from '../call-dock-numpad.vue';

const mountNumpad = (digits = '') =>
	mount(CallDockNumpad, {
		props: {
			digits,
		},
		global: {
			stubs: {
				'wt-input-text': {
					props: [
						'modelValue',
					],
					template: '<input class="input" :value="modelValue" />',
				},
			},
		},
	});

describe('call-dock-numpad', () => {
	it('shows the digits it is given', () => {
		const wrapper = mountNumpad('12#');

		expect((wrapper.find('.input').element as HTMLInputElement).value).toBe(
			'12#',
		);
	});

	it('emits the pressed digit without keeping it', async () => {
		const wrapper = mountNumpad();

		wrapper.findComponent(NumpadKeys).vm.$emit('digit', '5');

		expect(wrapper.emitted('digit')).toEqual([
			[
				'5',
			],
		]);
		expect((wrapper.find('.input').element as HTMLInputElement).value).toBe('');
	});
});
