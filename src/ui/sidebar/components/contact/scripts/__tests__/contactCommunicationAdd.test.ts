import {
	CommunicationsAPI,
	EmailsAPI,
	PhonesAPI,
} from '@webitel/api-services/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@webitel/api-services/api', () => ({
	PhonesAPI: {
		add: vi.fn(),
	},
	EmailsAPI: {
		add: vi.fn(),
	},
	CommunicationsAPI: {
		getLookup: vi.fn(),
	},
}));

import {
	addCommunication,
	communicationValueField,
	isAddableCommunicationTab,
	loadCommunicationTypes,
} from '../contactCommunicationAdd';

const workType = {
	id: '7',
	name: 'Work',
};

describe('contactCommunicationAdd', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('takes new records on Phones and Emails, not on Messaging', () => {
		expect(isAddableCommunicationTab('phones')).toBe(true);
		expect(isAddableCommunicationTab('emails')).toBe(true);
		expect(isAddableCommunicationTab('messaging')).toBe(false);
	});

	it('keeps a phone under `number` and an email under `email`', () => {
		expect(communicationValueField('phones')).toBe('number');
		expect(communicationValueField('emails')).toBe('email');
	});

	it('loads the communication types of the tab channel', () => {
		loadCommunicationTypes('phones', {
			search: 'wo',
		});
		loadCommunicationTypes('emails', {});

		expect(CommunicationsAPI.getLookup).toHaveBeenNthCalledWith(1, {
			search: 'wo',
			channel: 'Phone',
		});
		expect(CommunicationsAPI.getLookup).toHaveBeenNthCalledWith(2, {
			channel: 'Email',
		});
	});

	it('adds a phone number with its type and primary flag', async () => {
		await addCommunication(
			'phones',
			'15',
			{
				number: '380991358573',
				type: workType,
			},
			{
				primary: true,
			},
		);

		expect(PhonesAPI.add).toHaveBeenCalledWith({
			parentId: '15',
			itemInstance: {
				number: '380991358573',
				type: workType,
				primary: true,
			},
		});
		expect(EmailsAPI.add).not.toHaveBeenCalled();
	});

	it('adds an email through the emails endpoint', async () => {
		await addCommunication(
			'emails',
			'15',
			{
				email: 'agent@webitel.com',
				type: workType,
			},
			{
				primary: false,
			},
		);

		expect(EmailsAPI.add).toHaveBeenCalledWith({
			parentId: '15',
			itemInstance: {
				email: 'agent@webitel.com',
				type: workType,
				primary: false,
			},
		});
		expect(PhonesAPI.add).not.toHaveBeenCalled();
	});
});
