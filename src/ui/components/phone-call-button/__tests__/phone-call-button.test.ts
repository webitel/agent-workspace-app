import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@webitel/ui-sdk/components', () => ({
	WtButton: {
		name: 'WtButton',
		props: [
			'icon',
			'disabled',
			'loading',
		],
		emits: [
			'click',
		],
		template:
			'<button class="call-button" :data-icon="icon" :disabled="disabled" @click="$emit(\'click\')" />',
	},
}));

import PhoneCallButton from '../phone-call-button.vue';

const mountButton = (props: { number?: string; disabled?: boolean } = {}) =>
	mount(PhoneCallButton, {
		props,
	});

describe('PhoneCallButton', () => {
	it('shows the call icon', () => {
		const button = mountButton().find('.call-button');

		expect(button.attributes('data-icon')).toBe('call--filled');
	});

	it('names the number it calls', () => {
		const button = mountButton({
			number: '380991358573',
		}).find('.call-button');

		expect(button.attributes('aria-label')).toBe(
			'ui.pages.contacts.phones.call',
		);
	});

	it('emits click', async () => {
		const wrapper = mountButton({
			number: '380991358573',
		});

		await wrapper.find('.call-button').trigger('click');

		expect(wrapper.emitted('click')).toHaveLength(1);
	});

	it('passes the loading state', () => {
		const wrapper = mount(PhoneCallButton, {
			props: {
				loading: true,
			},
		});

		expect(
			wrapper
				.findComponent({
					name: 'WtButton',
				})
				.props('loading'),
		).toBe(true);
	});

	it('passes the disabled state', () => {
		const button = mountButton({
			disabled: true,
		}).find('.call-button');

		expect(button.attributes('disabled')).toBeDefined();
	});
});
