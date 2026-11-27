import { flushPromises } from '@vue/test-utils';
import { ContactsAPI } from '@webitel/api-services/api';
import {
	EngineSystemSettingName,
	type WebitelContactsContact,
} from '@webitel/api-services/gen/models';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	type EffectScope,
	effectScope,
	nextTick,
	type Ref,
	reactive,
	ref,
} from 'vue';

import { CONTACT_FIELDS } from '../../../../../../features/calls/modules/contact/constants/contactFields';

import { useContactIdentificationByNumber } from '../useContactIdentificationByNumber';

vi.mock('@webitel/api-services/api', () => ({
	ContactsAPI: {
		getList: vi.fn(),
		get: vi.fn(),
	},
}));

const settings = reactive<Record<string, unknown>>({});

// the real store pulls the socket client in; only the settings are read
vi.mock(
	'../../../../../../features/system-settings/store/systemSettings',
	() => ({
		useSystemSettingsStore: () => ({
			settings,
		}),
	}),
);

const getList = vi.mocked(ContactsAPI.getList);

type ContactsResponse = {
	items: WebitelContactsContact[];
	next: boolean;
};

const ids = (contacts: Ref<WebitelContactsContact[]>) =>
	contacts.value.map(({ id }) => id);

const found = (...contactIds: string[]): ContactsResponse => ({
	items: contactIds.map((id) => ({
		id,
	})),
	next: false,
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

let scope: EffectScope | undefined;

function setup(number?: string) {
	const phoneNumber = ref(number);
	scope = effectScope();
	const result = scope.run(() => useContactIdentificationByNumber(phoneNumber));
	if (!result) throw new Error('scope did not run');
	return {
		...result,
		phoneNumber,
	};
}

afterEach(() => {
	scope?.stop();
	scope = undefined;
	vi.clearAllMocks();
	for (const name of Object.keys(settings)) delete settings[name];
});

describe('useContactIdentificationByNumber', () => {
	it('searches nothing without a number', () => {
		const { contacts, isLoading } = setup(undefined);

		expect(getList).not.toHaveBeenCalled();
		expect(contacts.value).toEqual([]);
		expect(isLoading.value).toBe(false);
	});

	it('searches the contacts by the member number', () => {
		getList.mockResolvedValue(found());

		setup('380501112233');

		expect(getList).toHaveBeenCalledWith({
			q: '380501112233',
			qin: 'phones',
			size: 100,
			fields: CONTACT_FIELDS,
		});
	});

	it('shows the loader while searching, then the found contacts', async () => {
		const response = createDeferred<ContactsResponse>();
		getList.mockReturnValue(response.promise);

		const { contacts, isLoading } = setup('380501112233');
		expect(isLoading.value).toBe(true);

		response.resolve(found('15', '16'));
		await flushPromises();

		expect(isLoading.value).toBe(false);
		expect(ids(contacts)).toEqual([
			'15',
			'16',
		]);
	});

	it('finds none when the search fails', async () => {
		getList.mockRejectedValue(new Error('network'));

		const { contacts, isLoading } = setup('380501112233');
		await flushPromises();

		expect(isLoading.value).toBe(false);
		expect(contacts.value).toEqual([]);
	});

	it('searches again for another member number', async () => {
		getList.mockResolvedValue(found('15'));
		const { phoneNumber } = setup('111');
		await flushPromises();

		phoneNumber.value = '222';
		await flushPromises();

		expect(getList).toHaveBeenLastCalledWith(
			expect.objectContaining({
				q: '222',
			}),
		);
	});

	it('drops the answer for a number no longer selected', async () => {
		const stale = createDeferred<ContactsResponse>();
		getList
			.mockReturnValueOnce(stale.promise)
			.mockResolvedValueOnce(found('22'));
		const { contacts, phoneNumber } = setup('111');

		phoneNumber.value = '222';
		await flushPromises();
		stale.resolve(found('11'));
		await flushPromises();

		expect(ids(contacts)).toEqual([
			'22',
		]);
	});

	it('neither searches nor shows a contact while contacts are hidden', async () => {
		settings[EngineSystemSettingName.WbtHideContact] = true;

		const { contacts, isContactHidden } = setup('380501112233');
		await nextTick();

		expect(isContactHidden.value).toBe(true);
		expect(getList).not.toHaveBeenCalled();
		expect(contacts.value).toEqual([]);
	});

	it('puts a contact reloaded after the card changed it in its place', async () => {
		getList.mockResolvedValue(found('15', '16'));
		const { contacts, reloadContact } = setup('380501112233');
		await flushPromises();
		const fresh = {
			id: '16',
			about: 'reloaded',
		};
		vi.mocked(ContactsAPI.get).mockResolvedValue(fresh);

		await reloadContact('16');

		expect(contacts.value).toEqual([
			{
				id: '15',
			},
			fresh,
		]);
	});
});
