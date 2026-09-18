import { mount } from '@vue/test-utils';
import WebitelUI from '@webitel/ui-sdk';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { describe, expect, it } from 'vitest';

import TheNumpad from '../the-numpad.vue';

function mountNumpad() {
	return mount(TheNumpad, {
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

function callButton(wrapper: ReturnType<typeof mountNumpad>) {
	return wrapper
		.findAll('button')
		.find((button) => button.text() === 'ui.numpad.call');
}

describe('the-numpad', () => {
	it('appends a digit to the input when a key is clicked', async () => {
		const wrapper = mountNumpad();

		await wrapper
			.findAll('button')
			.find((button) => button.text() === '1')
			?.trigger('click');
		await wrapper
			.findAll('button')
			.find((button) => button.text() === '*')
			?.trigger('click');

		expect(wrapper.find('input').element.value).toBe('1*');
	});

	it('supports typing directly into the input', async () => {
		const wrapper = mountNumpad();
		const input = wrapper.find('input');

		await input.setValue('12345');

		expect(input.element.value).toBe('12345');
	});

	it('disables the call button until a number is entered', async () => {
		const wrapper = mountNumpad();

		expect(callButton(wrapper)?.attributes('disabled')).toBeDefined();

		await wrapper.find('input').setValue('123');

		expect(callButton(wrapper)?.attributes('disabled')).toBeUndefined();
	});

	it('emits call with the entered number when the call button is clicked', async () => {
		const wrapper = mountNumpad();

		await wrapper.find('input').setValue('  123  ');
		await callButton(wrapper)?.trigger('click');

		expect(wrapper.emitted('call')).toEqual([
			[
				'123',
			],
		]);
	});

	it('emits call when Enter is pressed in the input', async () => {
		const wrapper = mountNumpad();
		const input = wrapper.find('input');

		await input.setValue('456');
		await input.trigger('keyup.enter');

		expect(wrapper.emitted('call')).toEqual([
			[
				'456',
			],
		]);
	});

	it('does not emit call while the input is empty', async () => {
		const wrapper = mountNumpad();

		await wrapper.find('input').trigger('keyup.enter');

		expect(wrapper.emitted('call')).toBeUndefined();
	});
});
