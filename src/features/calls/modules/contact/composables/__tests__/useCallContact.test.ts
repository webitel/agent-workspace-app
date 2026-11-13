import { flushPromises } from '@vue/test-utils';
import { ContactsAPI, ContactsSearchMode } from '@webitel/api-services/api';
import {
	EngineSystemSettingName,
	type WebitelContactsContact,
} from '@webitel/api-services/gen/models';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	type EffectScope,
	effectScope,
	nextTick,
	reactive,
	shallowRef,
} from 'vue';
import { type Call, CallDirection } from 'webitel-sdk';

import { useCallContact } from '../useCallContact';

vi.mock('@webitel/api-services/api', async (importOriginal) => ({
	...(await importOriginal<typeof import('@webitel/api-services/api')>()),
	ContactsAPI: {
		getList: vi.fn(),
	},
}));

const callsById = reactive<Record<string, Call>>({});
const settings = reactive<Record<string, unknown>>({});

// the real stores pull the socket client in; only these slices are read
vi.mock('../../../../store/calls', () => ({
	useCallsStore: () => ({
		getCallById: (id: string) => callsById[id],
	}),
}));

vi.mock('../../../../../system-settings/store/systemSettings', () => ({
	useSystemSettingsStore: () => ({
		settings,
	}),
}));

const getList = vi.mocked(ContactsAPI.getList);

type ContactsResponse = {
	items: WebitelContactsContact[];
	next: boolean;
};

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

const found = (...ids: string[]): ContactsResponse => ({
	items: ids.map((id) => ({
		id,
		name: {
			commonName: `Contact ${id}`,
		},
	})),
	next: false,
});

const buildCall = (overrides: Partial<Call> = {}): Call =>
	reactive({
		id: 'call-1',
		direction: CallDirection.Inbound,
		displayNumber: '+12023417842',
		hideNumber: false,
		hideContact: false,
		bridgedId: '',
		contact: null,
		setContact: vi.fn().mockResolvedValue({}),
		...overrides,
	}) as unknown as Call;

let scope: EffectScope | undefined;

function setup(call: Call) {
	const callRef = shallowRef(call);
	scope = effectScope();
	const result = scope.run(() => useCallContact(callRef));
	if (!result) throw new Error('useCallContact scope did not run');
	return {
		...result,
		callRef,
	};
}

afterEach(() => {
	scope?.stop();
	scope = undefined;
	vi.clearAllMocks();
	for (const id of Object.keys(callsById)) delete callsById[id];
	for (const name of Object.keys(settings)) delete settings[name];
});

describe('useCallContact', () => {
	it('shows the linked contact at once, without a request or a loader', () => {
		const { contactIds, isLoading } = setup(
			buildCall({
				contact: {
					id: 42,
					hide: false,
				},
			}),
		);

		expect(contactIds.value).toEqual([
			'42',
		]);
		expect(isLoading.value).toBe(false);
		expect(getList).not.toHaveBeenCalled();
	});

	it('shows the loader while searching, then the found contacts', async () => {
		const response = createDeferred<ContactsResponse>();
		getList.mockReturnValue(response.promise);

		const { contactIds, isLoading } = setup(buildCall());
		expect(isLoading.value).toBe(true);
		expect(contactIds.value).toEqual([]);

		response.resolve(found('15', '16'));
		await flushPromises();

		expect(isLoading.value).toBe(false);
		expect(contactIds.value).toEqual([
			'15',
			'16',
		]);
	});

	it('searches again when the call changes', async () => {
		getList.mockResolvedValueOnce(found('15', '16'));
		const { contactIds, callRef } = setup(buildCall());
		await flushPromises();

		getList.mockResolvedValueOnce(found());
		callRef.value = buildCall({
			id: 'call-2',
			displayNumber: '+12023417843',
		});
		await flushPromises();

		expect(getList).toHaveBeenCalledTimes(2);
		expect(contactIds.value).toEqual([]);
	});

	it('does not let a late result of the previous call overwrite the current one', async () => {
		const first = createDeferred<ContactsResponse>();
		const second = createDeferred<ContactsResponse>();
		getList.mockReturnValueOnce(first.promise);
		getList.mockReturnValueOnce(second.promise);

		const { contactIds, isLoading, callRef } = setup(buildCall());
		callRef.value = buildCall({
			id: 'call-2',
			displayNumber: '+12023417843',
		});
		await nextTick();

		second.resolve(found('20', '21'));
		await flushPromises();
		first.resolve(found('10', '11'));
		await flushPromises();

		expect(contactIds.value).toEqual([
			'20',
			'21',
		]);
		expect(isLoading.value).toBe(false);
	});

	it('shows nothing found when the search fails', async () => {
		getList.mockRejectedValue(new Error('network error'));

		const { contactIds, isLoading } = setup(buildCall());
		await flushPromises();

		expect(contactIds.value).toEqual([]);
		expect(isLoading.value).toBe(false);
	});

	it('shows nothing found when linking the only contact fails', async () => {
		getList.mockResolvedValue(found('15'));
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { contactIds, isLoading } = setup(
			buildCall({
				setContact: vi.fn().mockRejectedValue(new Error('socket error')),
			}),
		);
		await flushPromises();

		expect(contactIds.value).toEqual([]);
		expect(isLoading.value).toBe(false);
		warn.mockRestore();
	});

	it('shows the only found contact right after linking it', async () => {
		getList.mockResolvedValue(found('15'));
		const call = buildCall();

		const { contactIds } = setup(call);
		await flushPromises();

		expect(call.setContact).toHaveBeenCalledWith(15);
		expect(contactIds.value).toEqual([
			'15',
		]);
	});

	it('takes a contact linked during the search instead of its result', async () => {
		const response = createDeferred<ContactsResponse>();
		getList.mockReturnValue(response.promise);
		const call = buildCall();

		const { contactIds, isLoading } = setup(call);
		// what the socket `set_contact` event does through the SDK's setContactId
		call.contact = {
			id: 99,
			hide: false,
		};
		await nextTick();

		expect(contactIds.value).toEqual([
			'99',
		]);
		expect(isLoading.value).toBe(false);

		response.resolve(found('15', '16'));
		await flushPromises();

		expect(contactIds.value).toEqual([
			'99',
		]);
	});

	it('neither shows nor searches a contact the call hides', () => {
		const { contactIds, isLoading, isContactHidden } = setup(
			buildCall({
				hideContact: true,
			}),
		);

		expect(isContactHidden.value).toBe(true);
		expect(contactIds.value).toEqual([]);
		expect(isLoading.value).toBe(false);
		expect(getList).not.toHaveBeenCalled();
	});

	it('neither shows nor searches a contact when the system setting hides contacts', () => {
		settings[EngineSystemSettingName.WbtHideContact] = true;

		const { isContactHidden } = setup(buildCall());

		expect(isContactHidden.value).toBe(true);
		expect(getList).not.toHaveBeenCalled();
	});

	describe('selecting one of several found contacts', () => {
		it('links the chosen contact and shows only it', async () => {
			getList.mockResolvedValue(found('15', '16'));
			const call = buildCall();

			const { contactIds, selectContact } = setup(call);
			await flushPromises();
			await selectContact('16');

			expect(call.setContact).toHaveBeenCalledWith(16);
			expect(contactIds.value).toEqual([
				'16',
			]);
		});

		it('keeps the found contacts when linking fails', async () => {
			getList.mockResolvedValue(found('15', '16'));
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const call = buildCall({
				setContact: vi.fn().mockRejectedValue(new Error('socket error')),
			});

			const { contactIds, selectContact } = setup(call);
			await flushPromises();
			await selectContact('16');

			expect(contactIds.value).toEqual([
				'15',
				'16',
			]);
			expect(warn).toHaveBeenCalled();
			warn.mockRestore();
		});

		it('lets the agent try again after a failure', async () => {
			getList.mockResolvedValue(found('15', '16'));
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const call = buildCall({
				setContact: vi
					.fn()
					.mockRejectedValueOnce(new Error('socket error'))
					.mockResolvedValueOnce({}),
			});

			const { contactIds, selectContact } = setup(call);
			await flushPromises();
			await selectContact('16');
			await selectContact('16');

			expect(call.setContact).toHaveBeenCalledTimes(2);
			expect(contactIds.value).toEqual([
				'16',
			]);
			warn.mockRestore();
		});

		it('ignores another select while linking is in progress', async () => {
			getList.mockResolvedValue(found('15', '16'));
			const linking = createDeferred<object>();
			const call = buildCall({
				setContact: vi.fn().mockReturnValue(linking.promise),
			});

			const { contactIds, selectContact } = setup(call);
			await flushPromises();
			const first = selectContact('15');
			const second = selectContact('16');
			linking.resolve({});
			await Promise.all([
				first,
				second,
			]);

			expect(call.setContact).toHaveBeenCalledTimes(1);
			expect(call.setContact).toHaveBeenCalledWith(15);
			expect(contactIds.value).toEqual([
				'15',
			]);
		});

		it('lets the agent select on another call while a link still hangs', async () => {
			getList.mockResolvedValueOnce(found('15', '16'));
			const firstCall = buildCall({
				setContact: vi.fn().mockReturnValue(new Promise(() => {})),
			});

			const { contactIds, selectContact, callRef } = setup(firstCall);
			await flushPromises();
			void selectContact('16');

			getList.mockResolvedValueOnce(found('20', '21'));
			const secondCall = buildCall({
				id: 'call-2',
				displayNumber: '+12023417843',
			});
			callRef.value = secondCall;
			await flushPromises();
			await selectContact('21');

			expect(secondCall.setContact).toHaveBeenCalledWith(21);
			expect(contactIds.value).toEqual([
				'21',
			]);
		});

		it('does not show the linked contact once another call is opened', async () => {
			getList.mockResolvedValueOnce(found('15', '16'));
			const linking = createDeferred<object>();
			const call = buildCall({
				setContact: vi.fn().mockReturnValue(linking.promise),
			});

			const { contactIds, selectContact, callRef } = setup(call);
			await flushPromises();
			const selecting = selectContact('16');

			getList.mockResolvedValueOnce(found('20', '21'));
			callRef.value = buildCall({
				id: 'call-2',
				displayNumber: '+12023417843',
			});
			await flushPromises();
			linking.resolve({});
			await selecting;

			expect(contactIds.value).toEqual([
				'20',
				'21',
			]);
		});
	});
	describe('search', () => {
		it('is no active search before the agent searches', async () => {
			getList.mockResolvedValueOnce(found());
			const { isSearchActive } = setup(buildCall());
			await flushPromises();

			expect(isSearchActive.value).toBe(false);
		});

		it.each([
			[
				ContactsSearchMode.NAME,
			],
			[
				ContactsSearchMode.DESTINATION,
			],
			[
				ContactsSearchMode.VARIABLES,
			],
		])('asks the contacts API to search the %s mode', async (searchMode) => {
			getList.mockResolvedValueOnce(found());
			const { search } = setup(buildCall());
			await flushPromises();

			getList.mockResolvedValueOnce(found());
			await search({
				query: ' sarah ',
				searchMode,
			});

			expect(getList).toHaveBeenLastCalledWith(
				expect.objectContaining({
					[searchMode]: 'sarah',
					size: 100,
				}),
			);
		});

		it('shows the contacts the search found instead of the identified ones', async () => {
			getList.mockResolvedValueOnce(found());
			const { contactIds, isSearchActive, search } = setup(buildCall());
			await flushPromises();

			getList.mockResolvedValueOnce(found('31', '32'));
			await search({
				query: 'sarah',
				searchMode: ContactsSearchMode.NAME,
			});

			expect(isSearchActive.value).toBe(true);
			expect(contactIds.value).toEqual([
				'31',
				'32',
			]);
		});

		it('is an active search with nothing in it when nothing is found', async () => {
			getList.mockResolvedValueOnce(found());
			const { contactIds, isSearchActive, search } = setup(buildCall());
			await flushPromises();

			getList.mockResolvedValueOnce(found());
			await search({
				query: 'nobody',
				searchMode: ContactsSearchMode.NAME,
			});

			expect(isSearchActive.value).toBe(true);
			expect(contactIds.value).toEqual([]);
		});

		it('links nothing to the call, even for the only match', async () => {
			getList.mockResolvedValueOnce(found());
			const call = buildCall();
			const { search } = setup(call);
			await flushPromises();

			getList.mockResolvedValueOnce(found('31'));
			await search({
				query: 'sarah',
				searchMode: ContactsSearchMode.NAME,
			});

			expect(call.setContact).not.toHaveBeenCalled();
		});

		it('is loading while the search runs', async () => {
			getList.mockResolvedValueOnce(found());
			const { isLoading, search } = setup(buildCall());
			await flushPromises();

			const searching = createDeferred<ContactsResponse>();
			getList.mockReturnValueOnce(searching.promise);
			const running = search({
				query: 'sarah',
				searchMode: ContactsSearchMode.NAME,
			});

			expect(isLoading.value).toBe(true);

			searching.resolve(found('31'));
			await running;

			expect(isLoading.value).toBe(false);
		});

		it('does not search for a blank query and ends an active search', async () => {
			getList.mockResolvedValueOnce(found());
			const { isSearchActive, search } = setup(buildCall());
			await flushPromises();
			getList.mockResolvedValueOnce(found('31'));
			await search({
				query: 'sarah',
				searchMode: ContactsSearchMode.NAME,
			});
			getList.mockClear();

			await search({
				query: '   ',
				searchMode: ContactsSearchMode.NAME,
			});

			expect(getList).not.toHaveBeenCalled();
			expect(isSearchActive.value).toBe(false);
		});

		it('goes back to the identified contacts on cancel', async () => {
			getList.mockResolvedValueOnce(found('15', '16'));
			const { contactIds, isSearchActive, search, cancelSearch } = setup(
				buildCall(),
			);
			await flushPromises();
			getList.mockResolvedValueOnce(found('31'));
			await search({
				query: 'sarah',
				searchMode: ContactsSearchMode.NAME,
			});

			cancelSearch();

			expect(isSearchActive.value).toBe(false);
			expect(contactIds.value).toEqual([
				'15',
				'16',
			]);
		});

		it('shows the answer of the latest search only', async () => {
			getList.mockResolvedValueOnce(found());
			const { contactIds, search } = setup(buildCall());
			await flushPromises();

			const first = createDeferred<ContactsResponse>();
			getList.mockReturnValueOnce(first.promise);
			const firstSearch = search({
				query: 'sa',
				searchMode: ContactsSearchMode.NAME,
			});
			getList.mockResolvedValueOnce(found('32'));
			await search({
				query: 'sarah',
				searchMode: ContactsSearchMode.NAME,
			});
			first.resolve(found('31'));
			await firstSearch;

			expect(contactIds.value).toEqual([
				'32',
			]);
		});

		it('ends the search when another call is opened', async () => {
			getList.mockResolvedValueOnce(found());
			const { isSearchActive, search, callRef } = setup(buildCall());
			await flushPromises();
			getList.mockResolvedValueOnce(found('31'));
			await search({
				query: 'sarah',
				searchMode: ContactsSearchMode.NAME,
			});

			getList.mockResolvedValueOnce(found());
			callRef.value = buildCall({
				id: 'call-2',
			});
			await flushPromises();

			expect(isSearchActive.value).toBe(false);
		});

		it('ends the search and shows the identified contacts when the search fails', async () => {
			getList.mockResolvedValueOnce(found('15', '16'));
			const { contactIds, isLoading, isSearchActive, search } = setup(
				buildCall(),
			);
			await flushPromises();

			getList.mockRejectedValueOnce(new Error('network error'));
			await search({
				query: 'sarah',
				searchMode: ContactsSearchMode.NAME,
			});

			expect(isSearchActive.value).toBe(false);
			expect(isLoading.value).toBe(false);
			expect(contactIds.value).toEqual([
				'15',
				'16',
			]);
		});

		it('ends the search when a contact is linked to the call meanwhile', async () => {
			getList.mockResolvedValueOnce(found());
			const call = buildCall();
			const { contactIds, isSearchActive, search } = setup(call);
			await flushPromises();
			getList.mockResolvedValueOnce(found('31', '32'));
			await search({
				query: 'sarah',
				searchMode: ContactsSearchMode.NAME,
			});

			call.contact = {
				id: 99,
				hide: false,
			};
			await nextTick();

			expect(isSearchActive.value).toBe(false);
			expect(contactIds.value).toEqual([
				'99',
			]);
		});

		it('ends the search once the selected contact is linked', async () => {
			getList.mockResolvedValueOnce(found('15', '16'));
			const { contactIds, isSearchActive, search, selectContact } = setup(
				buildCall(),
			);
			await flushPromises();
			getList.mockResolvedValueOnce(found('31', '32'));
			await search({
				query: 'sarah',
				searchMode: ContactsSearchMode.NAME,
			});

			await selectContact('32');

			expect(isSearchActive.value).toBe(false);
			expect(contactIds.value).toEqual([
				'32',
			]);
		});
	});
});
