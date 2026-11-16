import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SelfAssignedCallPhoneCell from '../self-assigned-call-phone-cell.vue';

// the cell uses the globally registered `wt-button`
const WtButton = {
	name: 'WtButton',
	props: [
		'loading',
	],
	emits: [
		'click',
	],
	template: '<button class="answer-button" @click="$emit(\'click\')" />',
};

const mountCell = (props: { phoneNumber?: string; loading?: boolean } = {}) =>
	mount(SelfAssignedCallPhoneCell, {
		props,
		global: {
			stubs: {
				WtButton,
			},
		},
	});

describe('self-assigned-call-phone-cell', () => {
	it('shows the number', () => {
		const wrapper = mountCell({
			phoneNumber: '380501112233',
		});

		expect(wrapper.text()).toContain('380501112233');
	});

	it('emits answer when the icon is clicked', async () => {
		const wrapper = mountCell({
			phoneNumber: '380501112233',
		});

		await wrapper.find('.answer-button').trigger('click');

		expect(wrapper.emitted('answer')).toHaveLength(1);
	});

	it('passes the loading state to the button', () => {
		const wrapper = mountCell({
			loading: true,
		});

		expect(
			wrapper
				.findComponent({
					name: 'WtButton',
				})
				.props('loading'),
		).toBe(true);
	});
});
