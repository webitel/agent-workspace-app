import { describe, expect, it } from 'vitest';
import type { NewContactDraft } from '../../contact-create-form.types';
import { toNewContactInput } from '../toNewContactInput';

const buildDraft = (
	overrides: Partial<NewContactDraft> = {},
): NewContactDraft => ({
	name: 'Jane Doe',
	phoneNumber: '',
	email: '',
	timezone: null,
	owner: null,
	labels: [],
	description: '',
	...overrides,
});

const mobileType = {
	id: '1',
	name: 'Mobile',
};
const workType = {
	id: '2',
	name: 'Work',
};

describe('toNewContactInput', () => {
	it('sends only the name for a contact with nothing else filled', () => {
		expect(toNewContactInput(buildDraft(), {})).toEqual({
			name: {
				commonName: 'Jane Doe',
			},
		});
	});

	it('trims the typed text', () => {
		const contact = toNewContactInput(
			buildDraft({
				name: '  Jane Doe ',
				phoneNumber: ' +380501234567 ',
				email: ' jane@example.com ',
				description: ' VIP ',
			}),
			{},
		);

		expect(contact.name?.commonName).toBe('Jane Doe');
		expect(contact.phones?.[0].number).toBe('+380501234567');
		expect(contact.emails?.[0].email).toBe('jane@example.com');
		expect(contact.about).toBe('VIP');
	});

	it('sends the phone and email as primary, with their channel default types', () => {
		const contact = toNewContactInput(
			buildDraft({
				phoneNumber: '+380501234567',
				email: 'jane@example.com',
			}),
			{
				phone: mobileType,
				email: workType,
			},
		);

		expect(contact.phones).toEqual([
			{
				number: '+380501234567',
				primary: true,
				type: mobileType,
			},
		]);
		expect(contact.emails).toEqual([
			{
				email: 'jane@example.com',
				primary: true,
				type: workType,
			},
		]);
	});

	it('sends a phone without a type when its channel has no default type', () => {
		const contact = toNewContactInput(
			buildDraft({
				phoneNumber: '+380501234567',
			}),
			{},
		);

		expect(contact.phones?.[0].type).toBeUndefined();
	});

	it('leaves out blank phone, email and description', () => {
		const contact = toNewContactInput(
			buildDraft({
				phoneNumber: '  ',
				email: ' ',
				description: '  ',
			}),
			{},
		);

		expect(contact).not.toHaveProperty('phones');
		expect(contact).not.toHaveProperty('emails');
		expect(contact).not.toHaveProperty('about');
	});

	it('sends the owner as the primary manager and the timezone as the contact timezone', () => {
		const owner = {
			id: '10',
			name: 'Agent',
		};
		const timezone = {
			id: '5',
			name: 'Europe/Kyiv',
		};

		const contact = toNewContactInput(
			buildDraft({
				owner,
				timezone,
			}),
			{},
		);

		expect(contact.managers).toEqual([
			{
				etag: '',
				primary: true,
				user: owner,
			},
		]);
		expect(contact.timezones).toEqual([
			{
				etag: '',
				timezone,
			},
		]);
	});

	it('sends the labels by their text only', () => {
		const contact = toNewContactInput(
			buildDraft({
				labels: [
					{
						label: 'vip',
						etag: 'stale',
					},
					{
						label: 'new',
					},
				],
			}),
			{},
		);

		expect(contact.labels).toEqual([
			{
				label: 'vip',
			},
			{
				label: 'new',
			},
		]);
	});
});
