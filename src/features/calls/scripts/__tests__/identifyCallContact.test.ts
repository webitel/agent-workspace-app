import { ContactsAPI } from '@webitel/api-services/api';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Call, CallDirection } from 'webitel-sdk';

import { identifyCallContact } from '../identifyCallContact';

vi.mock('@webitel/api-services/api', () => ({
	ContactsAPI: {
		getList: vi.fn(),
	},
}));

const getList = vi.mocked(ContactsAPI.getList);

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
	it('returns the contact linked to the call without searching', async () => {
		const call = buildCall({
			contact: {
				id: 42,
				hide: false,
			},
		});

		expect(await identifyCallContact(call, noCalls)).toEqual([
			'42',
		]);
		expect(getList).not.toHaveBeenCalled();
	});

	it('returns the contact of the bridged call without searching', async () => {
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
			'7',
		]);
		expect(getList).not.toHaveBeenCalled();
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

	it('searches by the client number in phones only', async () => {
		foundContacts();

		await identifyCallContact(buildCall(), noCalls);

		expect(getList).toHaveBeenCalledWith({
			q: '+12023417842',
			qin: 'phones',
			size: 100,
		});
	});

	it('returns nothing when no contact is found', async () => {
		foundContacts();
		const call = buildCall();

		expect(await identifyCallContact(call, noCalls)).toEqual([]);
		expect(call.setContact).not.toHaveBeenCalled();
	});

	it('links the only found contact to the call', async () => {
		foundContacts('15');
		const call = buildCall();

		expect(await identifyCallContact(call, noCalls)).toEqual([
			'15',
		]);
		expect(call.setContact).toHaveBeenCalledWith(15);
	});

	it('returns every found contact without linking any', async () => {
		foundContacts('15', '16', '17');
		const call = buildCall();

		expect(await identifyCallContact(call, noCalls)).toEqual([
			'15',
			'16',
			'17',
		]);
		expect(call.setContact).not.toHaveBeenCalled();
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
