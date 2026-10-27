import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import UsernameTableCell from '../username-table-cell.vue';

const stubs = {
	'wt-avatar': {
		props: [
			'username',
		],
		template: '<i class="avatar">{{ username }}</i>',
	},
};

const mountCell = (props: { name?: string; clickable?: boolean }) =>
	mount(UsernameTableCell, {
		props,
		global: {
			stubs,
		},
	});

describe('username-table-cell', () => {
	it('shows the name as plain text by default', () => {
		const wrapper = mountCell({
			name: 'John Doe',
		});

		expect(wrapper.find('button').exists()).toBe(false);
		expect(wrapper.find('.username-table-cell__name').text()).toBe('John Doe');
	});

	it('shows the name as a button when clickable', () => {
		const wrapper = mountCell({
			name: 'John Doe',
			clickable: true,
		});

		expect(wrapper.find('button').text()).toBe('John Doe');
	});

	it('emits click when the clickable name is clicked', async () => {
		const wrapper = mountCell({
			name: 'John Doe',
			clickable: true,
		});

		await wrapper.find('button').trigger('click');

		expect(wrapper.emitted('click')).toHaveLength(1);
	});
});
