import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { describe, expect, it } from 'vitest';

import { toContactInfo } from '../toContactInfo';

const contact = (
	overrides: Partial<WebitelContactsContact> = {},
): WebitelContactsContact => ({
	timezones: {
		data: [
			{
				timezone: {
					name: 'Europe/Kyiv',
				},
			},
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
	it('maps the first timezone and owner, group names and attributes', () => {
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

	it('takes the first entry even when a later one is marked primary', () => {
		const info = toContactInfo(
			contact({
				timezones: {
					data: [
						{
							timezone: {
								name: 'Europe/Kyiv',
							},
						},
						{
							primary: true,
							timezone: {
								name: 'Europe/London',
							},
						},
					],
				},
				managers: {
					data: [
						{
							user: {
								name: 'Anna Owner',
							},
						},
						{
							primary: true,
							user: {
								name: 'Second Manager',
							},
						},
					],
				},
			}),
		);

		expect(info.timezone).toBe('Europe/Kyiv');
		expect(info.owner).toBe('Anna Owner');
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
