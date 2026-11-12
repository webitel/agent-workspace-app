import { flushPromises } from '@vue/test-utils';
import { ContactsAPI } from '@webitel/api-services/api';
import {
	EngineSystemSettingName,
	type WebitelContactsContact,
} from '@webitel/api-services/gen/models';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type EffectScope, effectScope, nextTick, reactive, ref } from 'vue';

import { useContactIdentificationByNumber } from '../useContactIdentificationByNumber';

vi.mock('@webitel/api-services/api', () => ({
	ContactsAPI: {
		getList: vi.fn(),
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

const found = (...ids: string[]): ContactsResponse => ({
	items: ids.map((id) => ({
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
		const { contactIds, isLoading } = setup(undefined);

		expect(getList).not.toHaveBeenCalled();
		expect(contactIds.value).toEqual([]);
		expect(isLoading.value).toBe(false);
	});

	it('searches the contacts by the member number', () => {
		getList.mockResolvedValue(found());

		setup('380501112233');

		expect(getList).toHaveBeenCalledWith({
			q: '380501112233',
			qin: 'phones',
			size: 100,
		});
	});

	it('shows the loader while searching, then the found contacts', async () => {
		const response = createDeferred<ContactsResponse>();
		getList.mockReturnValue(response.promise);

		const { contactIds, isLoading } = setup('380501112233');
		expect(isLoading.value).toBe(true);

		response.resolve(found('15', '16'));
		await flushPromises();

		expect(isLoading.value).toBe(false);
		expect(contactIds.value).toEqual([
			'15',
			'16',
		]);
	});

	it('finds none when the search fails', async () => {
		getList.mockRejectedValue(new Error('network'));

		const { contactIds, isLoading } = setup('380501112233');
		await flushPromises();

		expect(isLoading.value).toBe(false);
		expect(contactIds.value).toEqual([]);
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
		const { contactIds, phoneNumber } = setup('111');

		phoneNumber.value = '222';
		await flushPromises();
		stale.resolve(found('11'));
		await flushPromises();

		expect(contactIds.value).toEqual([
			'22',
		]);
	});

	it('neither searches nor shows a contact while contacts are hidden', async () => {
		settings[EngineSystemSettingName.WbtHideContact] = true;

		const { contactIds, isContactHidden } = setup('380501112233');
		await nextTick();

		expect(isContactHidden.value).toBe(true);
		expect(getList).not.toHaveBeenCalled();
		expect(contactIds.value).toEqual([]);
	});
});
