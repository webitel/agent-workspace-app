import { CommunicationsAPI, ContactsAPI } from '@webitel/api-services/api';
import { EngineCommunicationChannels } from '@webitel/api-services/gen/models';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@webitel/api-services/api', () => ({
	ContactsAPI: {
		add: vi.fn(),
	},
	CommunicationsAPI: {
		getList: vi.fn(),
	},
}));

import type { NewContactDraft } from '../../contact-create-form.types';
import { useContactCreation } from '../useContactCreation';

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

const createDeferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((resolvePromise) => {
		resolve = resolvePromise;
	});
	return {
		promise,
		resolve,
	};
};

describe('useContactCreation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(ContactsAPI.add).mockResolvedValue({
			id: '42',
		});
		vi.mocked(CommunicationsAPI.getList).mockResolvedValue({
			items: [
				{
					id: '1',
					name: 'Mobile',
					channel: EngineCommunicationChannels.Phone,
					code: 'mobile',
				},
				{
					id: '2',
					name: 'Work',
					channel: EngineCommunicationChannels.Email,
					code: 'work',
				},
			],
			next: false,
		});
	});

	it('creates the contact and returns its id', async () => {
		const { createContact } = useContactCreation();

		await expect(createContact(buildDraft())).resolves.toBe('42');
		expect(ContactsAPI.add).toHaveBeenCalledWith({
			itemInstance: {
				name: {
					commonName: 'Jane Doe',
				},
			},
		});
	});

	it('does not look up communication types for a contact without a phone or an email', async () => {
		const { createContact } = useContactCreation();

		await createContact(buildDraft());

		expect(CommunicationsAPI.getList).not.toHaveBeenCalled();
	});

	it('sends the phone and email with the default type of their channel', async () => {
		const { createContact } = useContactCreation();

		await createContact(
			buildDraft({
				phoneNumber: '+380501234567',
				email: 'jane@example.com',
			}),
		);

		expect(CommunicationsAPI.getList).toHaveBeenCalledWith({
			channel: [
				EngineCommunicationChannels.Phone,
				EngineCommunicationChannels.Email,
			],
			default: true,
		});
		const [{ itemInstance }] = vi.mocked(ContactsAPI.add).mock.calls[0];
		expect(itemInstance.phones[0].type).toEqual({
			id: '1',
			name: 'Mobile',
		});
		expect(itemInstance.emails[0].type).toEqual({
			id: '2',
			name: 'Work',
		});
	});

	it('returns null and is ready again when the save fails', async () => {
		vi.mocked(ContactsAPI.add).mockRejectedValueOnce(new Error('400'));
		const { createContact, isSaving } = useContactCreation();

		await expect(createContact(buildDraft())).resolves.toBeNull();
		expect(isSaving.value).toBe(false);
	});

	it('returns null when the default types cannot be read, creating nothing', async () => {
		vi.mocked(CommunicationsAPI.getList).mockRejectedValueOnce(
			new Error('500'),
		);
		const { createContact } = useContactCreation();

		await expect(
			createContact(
				buildDraft({
					email: 'jane@example.com',
				}),
			),
		).resolves.toBeNull();
		expect(ContactsAPI.add).not.toHaveBeenCalled();
	});

	it('ignores a second save while the first is in flight', async () => {
		const request = createDeferred<{
			id: string;
		}>();
		vi.mocked(ContactsAPI.add).mockReturnValueOnce(request.promise);
		const { createContact, isSaving } = useContactCreation();

		const first = createContact(buildDraft());
		expect(isSaving.value).toBe(true);
		await expect(createContact(buildDraft())).resolves.toBeNull();

		request.resolve({
			id: '42',
		});
		await expect(first).resolves.toBe('42');
		expect(ContactsAPI.add).toHaveBeenCalledTimes(1);
		expect(isSaving.value).toBe(false);
	});
});
