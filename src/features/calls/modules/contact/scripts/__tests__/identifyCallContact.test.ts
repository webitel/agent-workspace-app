import { ContactsAPI } from '@webitel/api-services/api';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Call, CallDirection } from 'webitel-sdk';

import { CONTACT_FIELDS } from '../../constants/contactFields';
import { identifyCallContact } from '../identifyCallContact';

vi.mock('@webitel/api-services/api', () => ({
	ContactsAPI: {
		getList: vi.fn(),
		get: vi.fn(),
	},
}));

const getList = vi.mocked(ContactsAPI.getList);
const get = vi.mocked(ContactsAPI.get);

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		id: 'call-1',
		direction: CallDirection.Inbound,
		displayNumber: '+12023417842',
		hideNumber: false,
		bridgedId: '',
		contact: null,
		setContact: vi.fn().mockResolvedValue({}),
		...overrides,
	}) as unknown as Call;

const buildContact = (id: string): WebitelContactsContact => ({
	id,
	name: {
		commonName: `Contact ${id}`,
	},
});

const foundContacts = (...ids: string[]) =>
	getList.mockResolvedValue({
		items: ids.map(buildContact),
		next: false,
	});

const noCalls = () => undefined;

afterEach(() => {
	vi.clearAllMocks();
});

describe('identifyCallContact', () => {
	it('loads the contact linked to the call without searching', async () => {
		get.mockResolvedValue(buildContact('42'));
		const call = buildCall({
			contact: {
				id: 42,
				hide: false,
			},
		});

		expect(await identifyCallContact(call, noCalls)).toEqual([
			buildContact('42'),
		]);
		expect(get).toHaveBeenCalledWith({
			itemId: '42',
		});
		expect(getList).not.toHaveBeenCalled();
	});

	it('loads the contact of the bridged call without searching', async () => {
		get.mockResolvedValue(buildContact('7'));
		const bridgedCall = buildCall({
			id: 'call-2',
			contact: {
				id: 7,
				hide: false,
			},
		});
		const call = buildCall({
			bridgedId: 'call-2',
		});

		expect(await identifyCallContact(call, () => bridgedCall)).toEqual([
			buildContact('7'),
		]);
		expect(get).toHaveBeenCalledWith({
			itemId: '7',
		});
		expect(getList).not.toHaveBeenCalled();
	});

	it('throws a failed load of the linked contact to the caller', async () => {
		const error = new Error('network error');
		get.mockRejectedValue(error);
		const call = buildCall({
			contact: {
				id: 42,
				hide: false,
			},
		});

		await expect(identifyCallContact(call, noCalls)).rejects.toBe(error);
	});

	it('does not search without a number', async () => {
		const call = buildCall({
			displayNumber: undefined,
		});

		expect(await identifyCallContact(call, noCalls)).toEqual([]);
		expect(getList).not.toHaveBeenCalled();
	});

	it('does not search when the number is hidden', async () => {
		const call = buildCall({
			hideNumber: true,
		});

		expect(await identifyCallContact(call, noCalls)).toEqual([]);
		expect(getList).not.toHaveBeenCalled();
	});

	it('searches by the client number in phones only, with every field the card shows', async () => {
		foundContacts();

		await identifyCallContact(buildCall(), noCalls);

		expect(getList).toHaveBeenCalledWith({
			q: '+12023417842',
			qin: 'phones',
			size: 100,
			fields: CONTACT_FIELDS,
		});
	});

	it('returns nothing when no contact is found', async () => {
		foundContacts();
		const call = buildCall();

		expect(await identifyCallContact(call, noCalls)).toEqual([]);
		expect(call.setContact).not.toHaveBeenCalled();
	});

	it('links the only found contact to the call, without loading it again', async () => {
		foundContacts('15');
		const call = buildCall();

		expect(await identifyCallContact(call, noCalls)).toEqual([
			buildContact('15'),
		]);
		expect(call.setContact).toHaveBeenCalledWith(15);
		expect(get).not.toHaveBeenCalled();
	});

	it('passes the found contacts on before linking the only one', async () => {
		foundContacts('15');
		const onFound = vi.fn();
		const call = buildCall();

		await identifyCallContact(call, noCalls, onFound);

		expect(onFound).toHaveBeenCalledWith([
			buildContact('15'),
		]);
		expect(onFound.mock.invocationCallOrder[0]).toBeLessThan(
			vi.mocked(call.setContact).mock.invocationCallOrder[0],
		);
	});

	it('passes nothing on for the linked contact', async () => {
		get.mockResolvedValue(buildContact('42'));
		const onFound = vi.fn();

		await identifyCallContact(
			buildCall({
				contact: {
					id: 42,
					hide: false,
				},
			}),
			noCalls,
			onFound,
		);

		expect(onFound).not.toHaveBeenCalled();
	});

	it('returns every found contact without linking any', async () => {
		foundContacts('15', '16', '17');
		const call = buildCall();

		expect(await identifyCallContact(call, noCalls)).toEqual([
			buildContact('15'),
			buildContact('16'),
			buildContact('17'),
		]);
		expect(call.setContact).not.toHaveBeenCalled();
		expect(get).not.toHaveBeenCalled();
	});

	it('returns nothing when linking the found contact fails', async () => {
		foundContacts('15');
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const call = buildCall({
			setContact: vi.fn().mockRejectedValue(new Error('socket error')),
		});

		expect(await identifyCallContact(call, noCalls)).toEqual([]);
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it('throws a failed search to the caller', async () => {
		const error = new Error('network error');
		getList.mockRejectedValue(error);

		await expect(identifyCallContact(buildCall(), noCalls)).rejects.toBe(error);
	});
});
