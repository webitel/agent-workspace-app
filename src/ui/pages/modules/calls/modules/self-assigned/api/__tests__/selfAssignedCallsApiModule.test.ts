import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowRef } from 'vue';

const setWaitingCallsQuery = vi.fn();
const agent = shallowRef<{
	setWaitingCallsQuery: typeof setWaitingCallsQuery;
} | null>(null);

vi.mock(
	'../../../../../../../../app/api/socket/composables/useWebSocketClient',
	() => ({
		useWebSocketClient: () => ({
			agent,
		}),
	}),
);

import { selfAssignedCallsApiModule } from '../selfAssignedCallsApiModule';

describe('selfAssignedCallsApiModule.getList', () => {
	beforeEach(() => {
		setWaitingCallsQuery.mockReset();
		agent.value = {
			setWaitingCallsQuery,
		};
	});

	it('hands table store params over to the SDK query', async () => {
		await selfAssignedCallsApiModule.getList({
			search: 'john',
			page: 1,
			size: 20,
			sort: '-joined_at',
			fields: [
				'id',
				'name',
			],
		});

		expect(setWaitingCallsQuery).toHaveBeenCalledWith({
			q: 'john',
			size: 20,
			sort: '-joined_at',
		});
	});

	it('passes the search as is, without a wildcard', async () => {
		await selfAssignedCallsApiModule.getList({
			search: '+38050',
			size: 20,
		});

		expect(setWaitingCallsQuery).toHaveBeenCalledWith(
			expect.objectContaining({
				q: '+38050',
			}),
		);
	});

	it('sends empty search and no sort when they are not set', async () => {
		await selfAssignedCallsApiModule.getList({
			size: 20,
			sort: null,
		});

		expect(setWaitingCallsQuery).toHaveBeenCalledWith({
			q: '',
			size: 20,
			sort: null,
		});
	});

	it('returns no items: the table reads the list from the agent', async () => {
		const result = await selfAssignedCallsApiModule.getList({
			size: 20,
		});

		expect(result).toEqual({});
	});

	it('does nothing when there is no agent', async () => {
		agent.value = null;

		const result = await selfAssignedCallsApiModule.getList({
			size: 20,
		});

		expect(result).toEqual({});
		expect(setWaitingCallsQuery).not.toHaveBeenCalled();
	});
});
