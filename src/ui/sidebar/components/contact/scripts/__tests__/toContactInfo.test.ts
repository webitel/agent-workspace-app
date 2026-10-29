import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { describe, expect, it } from 'vitest';

import { toContactInfo } from '../toContactInfo';

const contact = (
	overrides: Partial<WebitelContactsContact> = {},
): WebitelContactsContact => ({
	timezones: {
		data: [
			{
				primary: false,
				timezone: {
					name: 'Europe/London',
				},
			},
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
					name: 'Anna Owner',
				},
			},
			{
				user: {
					name: 'Second Manager',
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
				key: 'CustomerID',
				value: '458732',
			},
			{
				key: 'Plan',
				value: {
					tier: 'gold',
				},
			},
		],
	},
	...overrides,
});

describe('toContactInfo', () => {
	it('maps the primary timezone and owner, group names and attributes', () => {
		expect(toContactInfo(contact())).toEqual({
			timezone: 'Europe/Kyiv',
			owner: 'Anna Owner',
			groups: 'VIP, Partners',
			attributes: [
				{
					id: 'contact:CustomerID',
					key: 'CustomerID',
					value: '458732',
				},
				{
					id: 'contact:Plan',
					key: 'Plan',
					value: '{"tier":"gold"}',
				},
			],
		});
	});

	it('does not fall back to the first entry when nothing is primary', () => {
		const info = toContactInfo(
			contact({
				timezones: {
					data: [
						{
							timezone: {
								name: 'Europe/London',
							},
						},
					],
				},
				managers: {
					data: [
						{
							primary: false,
							user: {
								name: 'Second Manager',
							},
						},
					],
				},
			}),
		);

		expect(info.timezone).toBe('');
		expect(info.owner).toBe('');
	});

	it('skips groups without a name', () => {
		const info = toContactInfo(
			contact({
				groups: {
					data: [
						{
							group: {
								name: 'VIP',
							},
						},
						{},
						{
							group: {},
						},
					],
				},
			}),
		);

		expect(info.groups).toBe('VIP');
	});

	it('drops attributes without a key', () => {
		const info = toContactInfo(
			contact({
				variables: {
					data: [
						{
							value: 'orphan',
						},
						{
							key: 'Region',
							value: 'EU',
						},
					],
				},
			}),
		);

		expect(info.attributes).toEqual([
			{
				id: 'contact:Region',
				key: 'Region',
				value: 'EU',
			},
		]);
	});

	it('returns empty values when the lists are empty or absent', () => {
		const empty = {
			timezone: '',
			owner: '',
			groups: '',
			attributes: [],
		};

		expect(toContactInfo({})).toEqual(empty);
		expect(
			toContactInfo({
				timezones: {
					data: [],
				},
				managers: {},
				groups: {
					data: [],
				},
				variables: {},
			}),
		).toEqual(empty);
	});
});
