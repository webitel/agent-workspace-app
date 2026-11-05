import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowRef } from 'vue';

const offlineMembers = vi.fn();
const agent = shallowRef<{
	offlineMembers: typeof offlineMembers;
} | null>(null);

vi.mock(
	'../../../../../../../../app/api/socket/composables/useWebSocketClient',
	() => ({
		useWebSocketClient: () => ({
			agent,
		}),
	}),
);

import { offlineMembersApiModule } from '../offlineMembersApiModule';

describe('offlineMembersApiModule.getList', () => {
	beforeEach(() => {
		offlineMembers.mockReset();
		offlineMembers.mockResolvedValue({
			items: [],
			next: false,
		});
		agent.value = {
			offlineMembers,
		};
	});

	it('maps table store params to positional SDK arguments', async () => {
		await offlineMembersApiModule.getList({
			search: 'john',
			page: 2,
			size: 20,
			sort: '-name',
			fields: [
				'id',
				'name',
			],
		});

		expect(offlineMembers).toHaveBeenCalledWith('john*', 2, 20, '-name');
	});

	it('does not add a second wildcard to the search', async () => {
		await offlineMembersApiModule.getList({
			search: 'jo*',
			page: 1,
			size: 20,
		});

		expect(offlineMembers).toHaveBeenCalledWith('jo*', 1, 20, '');
	});

	it('sends empty search and sort when they are not set', async () => {
		await offlineMembersApiModule.getList({
			page: 1,
			size: 20,
		});

		expect(offlineMembers).toHaveBeenCalledWith('', 1, 20, '');
	});

	it('converts the reply to camelCase', async () => {
		offlineMembers.mockResolvedValue({
			items: [
				{
					id: 1,
					hide_number: 'false',
				},
			],
			next: true,
		});

		const { items, next } = await offlineMembersApiModule.getList({
			page: 1,
			size: 20,
		});

		expect(items).toEqual([
			{
				id: 1,
				hideNumber: 'false',
			},
		]);
		expect(next).toBe(true);
	});

	it('returns an empty list without calling the SDK when there is no agent', async () => {
		agent.value = null;

		const result = await offlineMembersApiModule.getList({
			page: 1,
			size: 20,
		});

		expect(result).toEqual({
			items: [],
			next: false,
		});
		expect(offlineMembers).not.toHaveBeenCalled();
	});
});
