import { mount } from '@vue/test-utils';
import type { ContactsEmailAddress } from '@webitel/api-services/gen/models';
import { IconColor } from '@webitel/ui-sdk/enums';
import { describe, expect, it, vi } from 'vitest';

import ContactEmailsCell from '../contact-emails-cell.vue';

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
			'<div class="emails-menu"><slot name="activator" :toggle="() => {}" /></div>',
	},
	WtTooltip: {
		template:
			'<div class="tooltip"><slot name="activator" /><span class="tooltip-text"><slot /></span></div>',
	},
	WtChip: {
		template: '<span class="more-chip"><slot /></span>',
	},
}));

const mountCell = (emails?: ContactsEmailAddress[]) =>
	mount(ContactEmailsCell, {
		props: {
			emails,
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

const menuOf = (wrapper: ReturnType<typeof mountCell>) =>
	wrapper.findComponent({
		name: 'WtContextMenu',
	});

describe('contact-emails-cell', () => {
	it('shows a disabled email icon and "No email" when the contact has no email', () => {
		const wrapper = mountCell([]);
		const icon = wrapper.find('.icon');

		expect(wrapper.text()).toContain('ui.pages.contacts.emails.noEmail');
		expect(icon.attributes('data-icon')).toBe('ws-navigation-email');
		expect(icon.attributes('data-color')).toBe(IconColor.DISABLED);
	});

	it('treats a missing email list as no email', () => {
		expect(mountCell().text()).toContain('ui.pages.contacts.emails.noEmail');
	});

	it('treats records without an address as no email', () => {
		expect(
			mountCell([
				{
					id: '1',
				},
			]).text(),
		).toContain('ui.pages.contacts.emails.noEmail');
	});

	it('shows the email icon in the mail color', () => {
		const icon = mountCell([
			{
				email: 'a@example.com',
			},
		]).find('.icon');

		expect(icon.attributes('data-icon')).toBe('ws-navigation-email');
		expect(icon.attributes('data-color')).toBe(IconColor.MAIL);
	});

	it('shows the primary address, not the first one', () => {
		const wrapper = mountCell([
			{
				email: 'a@example.com',
			},
			{
				email: 'b@example.com',
				primary: true,
			},
		]);

		expect(wrapper.find('.communication-cell-list__value').text()).toBe(
			'b@example.com',
		);
	});

	it('falls back to the first address when none is primary', () => {
		const wrapper = mountCell([
			{
				email: 'a@example.com',
			},
			{
				email: 'b@example.com',
			},
		]);

		expect(wrapper.find('.communication-cell-list__value').text()).toBe(
			'a@example.com',
		);
	});

	it('shows no counter for a single address', () => {
		expect(
			menuOf(
				mountCell([
					{
						email: 'a@example.com',
					},
				]),
			).exists(),
		).toBe(false);
	});

	it('counts the addresses besides the shown one, with a tooltip', () => {
		const wrapper = mountCell([
			{
				email: 'a@example.com',
			},
			{
				email: 'b@example.com',
			},
			{
				email: 'c@example.com',
			},
		]);

		expect(wrapper.find('.more-chip').text()).toBe('+2');
		expect(wrapper.find('.tooltip-text').text()).toBe(
			'ui.pages.contacts.emails.moreEmails',
		);
	});

	it('lists every address in the menu, skipping records without one', () => {
		const wrapper = mountCell([
			{
				email: 'a@example.com',
			},
			{
				id: '2',
			},
			{
				email: 'b@example.com',
			},
		]);

		expect(menuOf(wrapper).props('options')).toEqual([
			{
				text: 'a@example.com',
			},
			{
				text: 'b@example.com',
			},
		]);
	});
});
