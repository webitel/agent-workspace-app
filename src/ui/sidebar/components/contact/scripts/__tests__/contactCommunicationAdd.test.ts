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
	isAddableCommunicationTab,
	isInvalidCommunicationValue,
	isValidCommunicationDraft,
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

	describe('isValidCommunicationDraft', () => {
		it('needs a value and a communication type', () => {
			expect(
				isValidCommunicationDraft('phones', {
					value: '380991358573',
					type: workType,
				}),
			).toBe(true);
			expect(
				isValidCommunicationDraft('phones', {
					value: '380991358573',
					type: null,
				}),
			).toBe(false);
			expect(
				isValidCommunicationDraft('phones', {
					value: '   ',
					type: workType,
				}),
			).toBe(false);
		});

		it('takes any non-empty phone number, with no format check', () => {
			expect(
				isValidCommunicationDraft('phones', {
					value: '*100#ext',
					type: workType,
				}),
			).toBe(true);
		});

		it('needs an email to look like one', () => {
			expect(
				isValidCommunicationDraft('emails', {
					value: 'agent@webitel.com',
					type: workType,
				}),
			).toBe(true);
			expect(
				isValidCommunicationDraft('emails', {
					value: 'agent@',
					type: workType,
				}),
			).toBe(false);
		});
	});

	describe('isInvalidCommunicationValue', () => {
		it('flags a malformed email, but not an empty one', () => {
			expect(isInvalidCommunicationValue('emails', 'agent@')).toBe(true);
			expect(isInvalidCommunicationValue('emails', '')).toBe(false);
			expect(isInvalidCommunicationValue('emails', 'agent@webitel.com')).toBe(
				false,
			);
		});

		it('never flags a typed phone number', () => {
			expect(isInvalidCommunicationValue('phones', '12ab')).toBe(false);
		});
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

	it('adds a trimmed phone number with its type and primary flag', async () => {
		await addCommunication(
			'phones',
			'15',
			{
				value: ' 380991358573 ',
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
				value: 'agent@webitel.com',
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
