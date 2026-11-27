import { flushPromises } from '@vue/test-utils';
import { ContactsAPI } from '@webitel/api-services/api';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	createContactReloader,
	replaceContact,
} from '../createContactReloader';

vi.mock('@webitel/api-services/api', () => ({
	ContactsAPI: {
		get: vi.fn(),
	},
}));

const get = vi.mocked(ContactsAPI.get);

const buildContact = (
	id: string,
	phone = '+380000000000',
): WebitelContactsContact => ({
	id,
	phones: {
		data: [
			{
				number: phone,
			},
		],
	},
});

const createDeferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return {
		promise,
		resolve,
	};
};

afterEach(() => {
	vi.clearAllMocks();
});

describe('createContactReloader', () => {
	it('loads the contact by its id and hands the fresh one on', async () => {
		get.mockResolvedValue(buildContact('15', '+380111111111'));
		const onLoaded = vi.fn();

		await createContactReloader(onLoaded)('15');

		expect(get).toHaveBeenCalledWith({
			itemId: '15',
		});
		expect(onLoaded).toHaveBeenCalledWith(buildContact('15', '+380111111111'));
	});

	it('hands on only the newest reload of a contact', async () => {
		const first = createDeferred<WebitelContactsContact>();
		const second = createDeferred<WebitelContactsContact>();
		get.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
		const onLoaded = vi.fn();
		const reload = createContactReloader(onLoaded);

		const firstReload = reload('15');
		const secondReload = reload('15');
		second.resolve(buildContact('15', '+380222222222'));
		await secondReload;
		first.resolve(buildContact('15', '+380111111111'));
		await firstReload;

		expect(onLoaded).toHaveBeenCalledTimes(1);
		expect(onLoaded).toHaveBeenCalledWith(buildContact('15', '+380222222222'));
	});

	it('hands on the reloads of different contacts each', async () => {
		get.mockImplementation(async ({ itemId }) => buildContact(String(itemId)));
		const onLoaded = vi.fn();
		const reload = createContactReloader(onLoaded);

		await Promise.all([
			reload('15'),
			reload('16'),
		]);

		expect(onLoaded).toHaveBeenCalledTimes(2);
	});

	it('hands nothing on when the reload fails', async () => {
		get.mockRejectedValue(new Error('network error'));
		const onLoaded = vi.fn();

		await createContactReloader(onLoaded)('15');
		await flushPromises();

		expect(onLoaded).not.toHaveBeenCalled();
	});
});

describe('replaceContact', () => {
	it('puts the contact in the place of the one with its id, keeping the order', () => {
		const fresh = buildContact('16', '+380111111111');

		expect(
			replaceContact(
				[
					buildContact('15'),
					buildContact('16'),
					buildContact('17'),
				],
				fresh,
			),
		).toEqual([
			buildContact('15'),
			fresh,
			buildContact('17'),
		]);
	});

	it('leaves the contacts as they are when none has its id', () => {
		const contacts = [
			buildContact('15'),
		];

		expect(replaceContact(contacts, buildContact('99'))).toEqual(contacts);
	});
});
