import { mount } from '@vue/test-utils';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { describe, expect, it } from 'vitest';

import KeyValueList from '../../../../key-value-list/key-value-list.vue';
import ContactCardInfo from '../contact-card-info.vue';

const contact: WebitelContactsContact = {
	timezones: {
		data: [
			{
				primary: true,
				timezone: {
					name: 'Europe/Kyiv',
				},
			},
		],
	},
	managers: {
		data: [
			{
				primary: true,
				user: {
					name: 'Alex Sanchez',
				},
			},
		],
	},
	groups: {
		data: [
			{
				group: {
					name: 'VIP',
				},
			},
			{
				group: {
					name: 'Partners',
				},
			},
		],
	},
	variables: {
		data: [
			{
				key: 'Account tier',
				value: 'Enterprise',
			},
		],
	},
};

const mountInfo = (value: WebitelContactsContact) =>
	mount(ContactCardInfo, {
		props: {
			contact: value,
		},
	});

describe('ContactCardInfo', () => {
	it('renders the Info block with timezone, owner and groups', () => {
		const [infoList] = mountInfo(contact).findAllComponents(KeyValueList);

		expect(infoList.props('title')).toBe('ui.sidebar.contact.info');
		expect(infoList.props('items')).toEqual([
			{
				id: 'timezone',
				key: 'date.timezone',
				value: 'Europe/Kyiv',
			},
			{
				id: 'owner',
				key: 'objects.owner',
				value: 'Alex Sanchez',
			},
			{
				id: 'groups',
				key: 'ui.sidebar.contact.groups',
				value: 'VIP, Partners',
			},
		]);
	});

	it('renders the Attributes block with its empty text', () => {
		const [, attributesList] =
			mountInfo(contact).findAllComponents(KeyValueList);

		expect(attributesList.props('title')).toBe('ui.sidebar.contact.attributes');
		expect(attributesList.props('items')).toEqual([
			{
				id: 'contact:Account tier',
				key: 'Account tier',
				value: 'Enterprise',
			},
		]);
		expect(attributesList.props('emptyText')).toBe(
			'ui.sidebar.contact.noAttributes',
		);
	});
});
