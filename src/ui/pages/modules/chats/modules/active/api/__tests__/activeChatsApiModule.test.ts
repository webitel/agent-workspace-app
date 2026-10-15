import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockThreadManagementSearch = vi.fn();

vi.mock('@webitel/api-services/gen-wire', () => ({
	getWebitelImApiGatewayV1Threadmanagement: () => ({
		threadManagementSearch: mockThreadManagementSearch,
	}),
}));

import { activeChatsApiModule } from '../activeChatsApiModule';

const USER_ID = 'agent';
const NOW = 1790947800000;
const CREATED_AT = NOW - 90_000;

const member = (contact: Record<string, unknown>) => ({
	contact,
});

const client = member({
	sub: 'client',
	name: 'John Doe',
	username: 'john',
});

// the API responds in snake_case, the module converts it with snakeToCamel
const thread = (overrides: Record<string, unknown> = {}) => ({
	id: 'thread-1',
	created_at: String(CREATED_AT),
	members: [
		member({
			sub: 'bot',
			name: 'Bot',
			is_bot: true,
		}),
		member({
			sub: USER_ID,
			name: 'Agent',
		}),
		client,
	],
	last_msg: {
		body: 'Hello',
	},
	...overrides,
});

const respond = (data: Record<string, unknown>) =>
	mockThreadManagementSearch.mockResolvedValue({
		data,
	});

const getList = (params: Record<string, unknown> = {}) =>
	activeChatsApiModule.getList({
		userId: USER_ID,
		...params,
	});

const requestParams = () => mockThreadManagementSearch.mock.calls[0][0];

describe('activeChatsApiModule.getList', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
		mockThreadManagementSearch.mockReset();
		respond({
			items: [],
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('request', () => {
		it('passes paging and the full set of fields', async () => {
			await getList({
				page: 2,
				size: 20,
			});

			expect(requestParams()).toEqual({
				page: 2,
				size: 20,
				q: undefined,
				sort: '+created_at',
				fields: [
					'id',
					'created_at',
					'members',
					'last_msg',
				],
			});
		});

		it('passes the search text', async () => {
			await getList({
				search: 'john',
			});

			expect(requestParams().q).toBe('john');
		});

		it('does not send an empty search', async () => {
			await getList({
				search: '',
			});

			expect(requestParams().q).toBeUndefined();
		});

		it.each([
			[
				undefined,
				'+created_at',
			],
			[
				'+duration',
				'-created_at',
			],
			[
				'-duration',
				'+created_at',
			],
			[
				'-created_at',
				'-created_at',
			],
		])('maps sort %s to %s', async (sort, apiSort) => {
			await getList({
				sort,
			});

			expect(requestParams().sort).toBe(apiSort);
		});
	});

	describe('response', () => {
		it('maps a thread to a table row', async () => {
			respond({
				items: [
					thread(),
				],
				next: true,
			});

			expect(await getList()).toEqual({
				items: [
					{
						id: 'thread-1',
						name: 'John Doe',
						username: 'john',
						message: 'Hello',
						startedAt: CREATED_AT,
						duration: 90,
					},
				],
				next: true,
			});
		});

		it('falls back to the username when the client has no name', async () => {
			respond({
				items: [
					thread({
						members: [
							member({
								sub: 'client',
								username: 'john',
							}),
						],
					}),
				],
			});

			const { items } = await getList();

			expect(items[0].name).toBe('john');
		});

		it('leaves client fields empty when there is no client', async () => {
			respond({
				items: [
					thread({
						members: [
							member({
								sub: USER_ID,
								name: 'Agent',
							}),
						],
						last_msg: undefined,
					}),
				],
			});

			const { items } = await getList();

			expect(items[0]).toMatchObject({
				name: '',
				username: '',
				message: '',
			});
		});

		it('returns an empty list when the response has no items', async () => {
			respond({});

			expect(await getList()).toEqual({
				items: [],
				next: false,
			});
		});
	});

	it('rethrows a request error', async () => {
		const error = new Error('Network Error');
		mockThreadManagementSearch.mockRejectedValue(error);

		await expect(getList()).rejects.toBe(error);
	});
});
