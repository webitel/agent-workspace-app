import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockThreadManagementSearchLeft = vi.fn();

vi.mock('@webitel/api-services/gen-wire', () => ({
	getWebitelImApiGatewayV1Threadmanagement: () => ({
		threadManagementSearchLeft: mockThreadManagementSearchLeft,
	}),
}));

import { closedChatsApiModule } from '../closedChatsApiModule';

const member = (contact: Record<string, unknown>) => ({
	contact,
});

const client = member({
	sub: 'client',
	iss: 'telegram',
	name: 'John Doe',
	username: 'john',
});

// the API responds in snake_case, the module converts it with snakeToCamel
const thread = (overrides: Record<string, unknown> = {}) => ({
	id: 'thread-1',
	created_at: '1790947707140',
	members: [
		member({
			sub: 'bot',
			iss: 'bot',
			name: 'Bot',
			is_bot: true,
		}),
		member({
			sub: 'agent',
			iss: 'webitel',
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
	mockThreadManagementSearchLeft.mockResolvedValue({
		data,
	});

const getList = (params: Record<string, unknown> = {}) =>
	closedChatsApiModule.getList({
		taskThreadIds: [],
		...params,
	});

const requestParams = () => mockThreadManagementSearchLeft.mock.calls[0][0];

describe('closedChatsApiModule.getList', () => {
	beforeEach(() => {
		mockThreadManagementSearchLeft.mockReset();
		respond({
			items: [],
		});
	});

	it('passes page and size, but no search text', async () => {
		await getList({
			page: 2,
			size: 20,
			search: 'john',
			q: 'john',
		});

		expect(requestParams()).toEqual({
			page: 2,
			size: 20,
			sort: undefined,
		});
	});

	it.each([
		'+queue_name',
		'-queue_name',
		'+channel_name',
		'-channel_name',
	])('passes the %s sort', async (sort) => {
		await getList({
			sort,
		});

		expect(requestParams().sort).toBe(sort);
	});

	it('drops a sort the endpoint does not take', async () => {
		await getList({
			sort: '-created_at',
		});

		expect(requestParams().sort).toBeUndefined();
	});

	it('shows the channel as the source and the queue by name', async () => {
		respond({
			items: [
				thread({
					channel: {
						id: 'gate-1',
						name: 'Support Telegram',
						type: 'telegram',
					},
					queue: {
						id: '12',
						name: 'Sales',
					},
				}),
			],
		});

		const { items } = await getList();

		expect(items[0].source).toBe('Support Telegram');
		expect(items[0].queue).toBe('Sales');
	});

	it('maps the client to name and username', async () => {
		respond({
			items: [
				thread(),
			],
		});

		const { items } = await getList();

		expect(items[0]).toMatchObject({
			id: 'thread-1',
			name: 'John Doe',
			username: 'john',
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

	it('leaves the fields the backend does not return empty', async () => {
		respond({
			items: [
				thread(),
			],
		});

		const { items } = await getList();

		expect(items[0].source).toBeUndefined();
		expect(items[0].queue).toBeUndefined();
		expect(items[0].startedAt).toBeUndefined();
		expect(items[0].endedAt).toBeUndefined();
		expect(items[0].duration).toBeUndefined();
		expect(items[0].message).toBeUndefined();
	});

	it('keeps the raw thread for opening the chat', async () => {
		respond({
			items: [
				thread(),
			],
		});

		const { items } = await getList();

		expect(items[0].thread).toMatchObject({
			id: 'thread-1',
		});
	});

	// the card shows these as the backend sent them (the SDK's own thread api
	// skips them too): keys are names the user chose, values are data
	it('keeps the thread variables, keys and values, as the backend sent them', async () => {
		const variables = {
			customer_id: {
				value: '42',
			},
			tags: {
				value: [
					'vip_client',
				],
			},
		};
		respond({
			items: [
				thread({
					variables: {
						variables,
					},
				}),
			],
		});

		const { items } = await getList();

		expect(items[0].thread.variables?.variables).toEqual(variables);
	});

	it('drops a thread any task backs, an offered one included', async () => {
		respond({
			items: [
				thread(),
				thread({
					id: 'thread-2',
				}),
			],
		});

		const { items } = await getList({
			taskThreadIds: [
				'thread-1',
			],
		});

		expect(items.map(({ id }) => id)).toEqual([
			'thread-2',
		]);
	});

	it('returns next from the response', async () => {
		respond({
			items: [],
			next: true,
		});

		expect((await getList()).next).toBe(true);
	});

	it('returns an empty list when the response has no items', async () => {
		respond({});

		expect(await getList()).toEqual({
			items: [],
			next: false,
		});
	});

	it('rethrows a request error', async () => {
		const error = new Error('Network Error');
		mockThreadManagementSearchLeft.mockRejectedValue(error);

		await expect(getList()).rejects.toBe(error);
	});
});
