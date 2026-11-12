import { ContactsAPI } from '@webitel/api-services/api';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ContactSearchMode } from '../../enums/ContactSearchMode.enum';
import { searchContactIds } from '../searchContactIds';

vi.mock('@webitel/api-services/api', () => ({
	ContactsAPI: {
		getList: vi.fn(),
	},
}));

const getList = vi.mocked(ContactsAPI.getList);

afterEach(() => {
	vi.clearAllMocks();
});

describe('searchContactIds', () => {
	it.each([
		[
			ContactSearchMode.Name,
			'name',
		],
		[
			ContactSearchMode.Destination,
			'emails,phones,imclients{user{name}}',
		],
		[
			ContactSearchMode.Attribute,
			'variables',
		],
	])('searches the %s mode in its own fields', async (mode, searchedFields) => {
		getList.mockResolvedValue({
			items: [],
			next: false,
		});

		await searchContactIds({
			query: 'sarah',
			mode,
		});

		expect(getList).toHaveBeenCalledWith(
			expect.objectContaining({
				q: 'sarah',
				qin: searchedFields,
			}),
		);
	});

	it('returns the ids of the found contacts, leaving out one without an id', async () => {
		getList.mockResolvedValue({
			items: [
				{
					id: '101',
				},
				{},
				{
					id: '102',
				},
			],
			next: false,
		});

		await expect(
			searchContactIds({
				query: 'sarah',
				mode: ContactSearchMode.Name,
			}),
		).resolves.toEqual([
			'101',
			'102',
		]);
	});

	it('throws a failed search to the caller', async () => {
		getList.mockRejectedValue(new Error('offline'));

		await expect(
			searchContactIds({
				query: 'sarah',
				mode: ContactSearchMode.Name,
			}),
		).rejects.toThrow('offline');
	});
});
