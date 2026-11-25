import { mount } from '@vue/test-utils';
import type { ContactsEmailAddress } from '@webitel/api-services/gen/models';
import { IconColor } from '@webitel/ui-sdk/enums';
import { describe, expect, it } from 'vitest';

import ContactEmailsCell from '../contact-emails-cell.vue';

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
				TableCellInfo: {
					name: 'TableCellInfo',
					props: [
						'icon',
						'iconColor',
						'items',
						'itemLabel',
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

describe('contact-emails-cell', () => {
	it('shows a disabled email icon and "No email" when the contact has no email', () => {
		const wrapper = mountCell([]);
		const icon = wrapper.find('.icon');

		expect(wrapper.text()).toContain('ui.pages.contacts.emails.noEmail');
		expect(icon.attributes('data-icon')).toBe('ws-navigation-email');
		expect(icon.attributes('data-color')).toBe(IconColor.DISABLED);
		expect(chipsOf(wrapper).exists()).toBe(false);
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

	it('shows the addresses as chips, skipping records without one', () => {
		const chips = chipsOf(
			mountCell([
				{
					id: '1',
				},
				{
					id: '2',
					email: 'john@example.com',
				},
			]),
		);

		expect(chips.props('iconColor')).toBe(IconColor.MAIL);
		expect(chips.props('itemLabel')).toBe('email');
		expect(chips.props('items')).toEqual([
			{
				id: '2',
				email: 'john@example.com',
			},
		]);
	});
});
