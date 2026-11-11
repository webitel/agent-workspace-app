import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { describe, expect, it } from 'vitest';

import { toContactCommunication } from '../toContactCommunication';

const contact: WebitelContactsContact = {
	phones: {
		data: [
			{
				id: '403',
				number: '380991358573',
				primary: true,
				type: {
					name: 'Mobile',
				},
			},
		],
	},
	imclients: {
		data: [
			{
				id: '1316',
				protocol: 'telegram',
				user: {
					name: 'Polina polinasukhorukova',
				},
			},
		],
	},
	emails: {
		data: [
			{
				id: '225',
				email: 'polina.agent@gmail.com',
				primary: true,
			},
			{
				id: '226',
				email: 'poli@test.com',
			},
		],
	},
};

describe('toContactCommunication', () => {
	it('maps phones, messengers and emails with their icons', () => {
		expect(toContactCommunication(contact)).toEqual({
			phones: [
				{
					id: '403',
					value: '380991358573',
					icon: 'call--filled',
				},
			],
			messaging: [
				{
					id: '1316',
					value: 'Polina polinasukhorukova',
					icon: 'telegram-bot',
				},
			],
			emails: [
				{
					id: '225',
					value: 'polina.agent@gmail.com',
					icon: 'ws-navigation-email',
				},
				{
					id: '226',
					value: 'poli@test.com',
					icon: 'ws-navigation-email',
				},
			],
		});
	});

	it('keeps a messenger without a name as its gateway icon alone', () => {
		const { messaging } = toContactCommunication({
			imclients: {
				data: [
					{
						id: '1',
						protocol: 'viber',
						imContactId: 'f3b1c2d4-0000-0000-0000-000000000000',
					},
				],
			},
		});

		expect(messaging).toEqual([
			{
				id: '1',
				value: '',
				icon: 'messenger-viber',
			},
		]);
	});

	it('leaves the icon out for an unknown gateway', () => {
		const { messaging } = toContactCommunication({
			imclients: {
				data: [
					{
						id: '1',
						protocol: 'unknown_gateway',
						user: {
							name: 'someone',
						},
					},
				],
			},
		});

		expect(messaging).toEqual([
			{
				id: '1',
				value: 'someone',
				icon: undefined,
			},
		]);
	});

	it('keeps every messenger record, even one with nothing to show', () => {
		const { messaging } = toContactCommunication({
			imclients: {
				data: [
					{
						id: '1',
					},
					{
						id: '2',
						protocol: 'unknown_gateway',
					},
				],
			},
		});

		expect(messaging).toEqual([
			{
				id: '1',
				value: '',
				icon: undefined,
			},
			{
				id: '2',
				value: '',
				icon: undefined,
			},
		]);
	});

	it('drops phones and emails without a value', () => {
		expect(
			toContactCommunication({
				phones: {
					data: [
						{
							id: '1',
						},
						{
							id: '2',
							number: '',
						},
					],
				},
				emails: {
					data: [
						{
							id: '1',
						},
					],
				},
			}),
		).toEqual({
			phones: [],
			messaging: [],
			emails: [],
		});
	});

	it('returns empty lists when the lists are empty or absent', () => {
		const empty = {
			phones: [],
			messaging: [],
			emails: [],
		};

		expect(toContactCommunication({})).toEqual(empty);
		expect(
			toContactCommunication({
				phones: {
					data: [],
				},
				imclients: {},
				emails: {
					data: [],
				},
			}),
		).toEqual(empty);
	});
});
