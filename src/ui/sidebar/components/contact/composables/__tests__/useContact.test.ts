import { ContactsAPI } from '@webitel/api-services/api';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type EffectScope, effectScope, nextTick, ref } from 'vue';
import { useContact } from '../useContact';

vi.mock('@webitel/api-services/api', () => ({
	ContactsAPI: {
		get: vi.fn(),
	},
}));

const createDeferred = <T>() => {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return {
		promise,
		resolve,
		reject,
	};
};

const contactA: WebitelContactsContact = {
	id: '1',
	name: {
		commonName: 'Contact A',
	},
};
const contactB: WebitelContactsContact = {
	id: '2',
	name: {
		commonName: 'Contact B',
	},
};

describe('useContact', () => {
	let scope: EffectScope;

	const setup = (initialId: string) => {
		const contactId = ref(initialId);
		const result = scope.run(() => useContact(contactId))!;
		return {
			contactId,
			...result,
		};
	};

	beforeEach(() => {
		scope = effectScope();
	});

	afterEach(() => {
		scope.stop();
		vi.mocked(ContactsAPI.get).mockReset();
	});

	it('loads contact by id', async () => {
		const request = createDeferred<WebitelContactsContact>();
		vi.mocked(ContactsAPI.get).mockReturnValueOnce(request.promise);

		const { contact, isLoading } = setup('1');

		expect(ContactsAPI.get).toHaveBeenCalledWith({
			itemId: '1',
		});
		expect(isLoading.value).toBe(true);
		expect(contact.value).toBeNull();

		request.resolve(contactA);
		await flushPromises();

		expect(contact.value).toEqual(contactA);
		expect(isLoading.value).toBe(false);
	});

	it('resets contact and reloads it when id changes', async () => {
		vi.mocked(ContactsAPI.get).mockResolvedValueOnce(contactA);
		const { contactId, contact, isLoading } = setup('1');
		await flushPromises();

		const request = createDeferred<WebitelContactsContact>();
		vi.mocked(ContactsAPI.get).mockReturnValueOnce(request.promise);
		contactId.value = '2';
		await nextTick();

		expect(ContactsAPI.get).toHaveBeenLastCalledWith({
			itemId: '2',
		});
		expect(contact.value).toBeNull();
		expect(isLoading.value).toBe(true);

		request.resolve(contactB);
		await flushPromises();

		expect(contact.value).toEqual(contactB);
		expect(isLoading.value).toBe(false);
	});

	it('ignores stale response when id changed before it arrived', async () => {
		const requestA = createDeferred<WebitelContactsContact>();
		const requestB = createDeferred<WebitelContactsContact>();
		vi.mocked(ContactsAPI.get)
			.mockReturnValueOnce(requestA.promise)
			.mockReturnValueOnce(requestB.promise);

		const { contactId, contact, isLoading } = setup('1');
		contactId.value = '2';
		await nextTick();

		requestA.resolve(contactA);
		await flushPromises();

		expect(contact.value).toBeNull();
		expect(isLoading.value).toBe(true);

		requestB.resolve(contactB);
		await flushPromises();

		expect(contact.value).toEqual(contactB);
		expect(isLoading.value).toBe(false);
	});

	it('stops loading and keeps contact empty on error', async () => {
		vi.mocked(ContactsAPI.get).mockRejectedValueOnce(new Error('fail'));

		const { contact, isLoading } = setup('1');
		await flushPromises();

		expect(contact.value).toBeNull();
		expect(isLoading.value).toBe(false);
	});
});
