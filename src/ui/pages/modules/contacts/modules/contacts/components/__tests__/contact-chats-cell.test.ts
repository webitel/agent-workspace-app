import { mount } from '@vue/test-utils';
import type { ContactsIMClient } from '@webitel/api-services/gen/models';
import { IconColor } from '@webitel/ui-sdk/enums';
import { describe, expect, it } from 'vitest';

import ContactChatsCell from '../contact-chats-cell.vue';

const mountCell = (imclients?: ContactsIMClient[]) =>
	mount(ContactChatsCell, {
		props: {
			imclients,
		},
		global: {
			stubs: {
				'wt-icon': {
					props: [
						'icon',
						'color',
					],
					template: '<i class="icon" :data-icon="icon" :data-color="color" />',
				},
				TableCellInfo: {
					name: 'TableCellInfo',
					props: [
						'icon',
						'iconColor',
						'items',
					],
					template: '<div class="chips" />',
				},
			},
		},
	});

const chipsOf = (wrapper: ReturnType<typeof mountCell>) =>
	wrapper.findComponent({
		name: 'TableCellInfo',
	});

describe('contact-chats-cell', () => {
	it('shows a disabled chat icon and "No chat" when the contact has no IM client', () => {
		const wrapper = mountCell([]);
		const icon = wrapper.find('.icon');

		expect(wrapper.text()).toContain('ui.pages.contacts.chats.noChat');
		expect(icon.attributes('data-icon')).toBe('ws-chat');
		expect(icon.attributes('data-color')).toBe(IconColor.DISABLED);
	});

	it('treats a missing IM client list as no chat', () => {
		expect(mountCell().text()).toContain('ui.pages.contacts.chats.noChat');
	});

	it('shows the named clients as chips', () => {
		const chips = chipsOf(
			mountCell([
				{
					id: '1',
					user: {
						name: 'John',
					},
				},
			]),
		);

		expect(chips.props('iconColor')).toBe(IconColor.CHAT);
		expect(chips.props('items')).toEqual([
			{
				id: '1',
				name: 'John',
			},
		]);
	});

	it('leaves nameless clients out of the chips', () => {
		const chips = chipsOf(
			mountCell([
				{
					id: '1',
					imContactId: 'uuid',
				},
				{
					id: '2',
					user: {
						name: 'John',
					},
				},
			]),
		);

		expect(chips.props('items')).toEqual([
			{
				id: '2',
				name: 'John',
			},
		]);
	});

	it('shows the active chat icon alone when every client is nameless', () => {
		const wrapper = mountCell([
			{
				id: '1',
				imContactId: 'uuid',
			},
		]);
		const icon = wrapper.find('.icon');

		expect(chipsOf(wrapper).exists()).toBe(false);
		expect(wrapper.text()).toBe('');
		expect(icon.attributes('data-icon')).toBe('ws-chat');
		expect(icon.attributes('data-color')).toBe(IconColor.CHAT);
	});
});
