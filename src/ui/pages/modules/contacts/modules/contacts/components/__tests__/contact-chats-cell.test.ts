import { mount } from '@vue/test-utils';
import type { ContactsIMClient } from '@webitel/api-services/gen/models';
import { IconColor } from '@webitel/ui-sdk/enums';
import { describe, expect, it, vi } from 'vitest';

import ContactChatsCell from '../contact-chats-cell.vue';

/**
 * `WtContextMenu` is a `defineAsyncComponent` in ui-sdk, which a `global.stubs`
 * entry does not replace, so the module is mocked as in contact-phones-cell.test.ts
 */
vi.mock('@webitel/ui-sdk/components', () => ({
	WtContextMenu: {
		name: 'WtContextMenu',
		props: [
			'options',
		],
		template:
			'<div class="chats-menu"><slot name="activator" :toggle="() => {}" /></div>',
	},
	WtTooltip: {
		template:
			'<div class="tooltip"><slot name="activator" /><span class="tooltip-text"><slot /></span></div>',
	},
	WtChip: {
		template: '<span class="more-chip"><slot /></span>',
	},
}));

const mountCell = (contactClients?: ContactsIMClient[]) =>
	mount(ContactChatsCell, {
		props: {
			contactClients,
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
			},
		},
	});

const named = (name: string): ContactsIMClient => ({
	user: {
		name,
	},
});

const nameless: ContactsIMClient = {
	imContactId: 'uuid',
};

const menuOf = (wrapper: ReturnType<typeof mountCell>) =>
	wrapper.findComponent({
		name: 'WtContextMenu',
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

	it('shows the first named client next to the chat icon', () => {
		const wrapper = mountCell([
			nameless,
			named('John'),
			named('Jane'),
		]);
		const icon = wrapper.find('.icon');

		expect(wrapper.find('.communication-cell-list__value').text()).toBe('John');
		expect(icon.attributes('data-icon')).toBe('ws-chat');
		expect(icon.attributes('data-color')).toBe(IconColor.CHAT);
	});

	it('shows the active chat icon alone when every client is nameless', () => {
		const wrapper = mountCell([
			nameless,
		]);

		expect(wrapper.text()).toBe('');
		expect(menuOf(wrapper).exists()).toBe(false);
		expect(wrapper.find('.icon').attributes('data-color')).toBe(IconColor.CHAT);
	});

	it('shows no counter for a single named client', () => {
		expect(
			menuOf(
				mountCell([
					named('John'),
					nameless,
				]),
			).exists(),
		).toBe(false);
	});

	it('counts the named clients besides the shown one, with a tooltip', () => {
		const wrapper = mountCell([
			named('John'),
			nameless,
			named('Jane'),
			named('Jim'),
		]);

		expect(wrapper.find('.more-chip').text()).toBe('+2');
		expect(wrapper.find('.tooltip-text').text()).toBe(
			'ui.pages.contacts.chats.moreChats',
		);
	});

	it('lists every named client in the menu', () => {
		const wrapper = mountCell([
			named('John'),
			nameless,
			named('Jane'),
		]);

		expect(menuOf(wrapper).props('options')).toEqual([
			{
				text: 'John',
			},
			{
				text: 'Jane',
			},
		]);
	});
});
