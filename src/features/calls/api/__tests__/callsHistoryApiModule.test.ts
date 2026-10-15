import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getListPost = vi.fn();

vi.mock('@webitel/api-services/api', () => ({
	CallHistoryAPI: {
		getListPost: (...args: unknown[]) => getListPost(...args),
	},
}));

import { callsHistoryApiModule } from '../callsHistoryApiModule';

const NOW = new Date(2026, 9, 6, 14, 30);
const END_OF_TODAY = new Date(2026, 9, 6, 23, 59, 59, 999).getTime();

const getRequest = () => getListPost.mock.calls[0][0];

describe('callsHistoryApiModule.getList', () => {
	beforeEach(() => {
		vi.useFakeTimers({
			now: NOW,
		});
		getListPost.mockReset();
		getListPost.mockResolvedValue({
			items: [],
			next: false,
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('expands virtual fields, adds required ones and removes duplicates', async () => {
		await callsHistoryApiModule.getList({
			fields: [
				'name',
				'created_at',
				'phone',
				'files',
			],
		});

		expect(getRequest().data.fields).toEqual([
			'files',
			'parent_id',
			'contact',
			'from',
			'to',
			'destination',
			'direction',
			'answered_at',
			'bridged_at',
			'queue',
			'created_at',
		]);
	});

	it('requests only required fields when none are passed', async () => {
		await callsHistoryApiModule.getList();

		expect(getRequest().data.fields).toEqual([
			'files',
			'parent_id',
		]);
	});

	it('sorts by newest first by default and keeps a passed sort', async () => {
		await callsHistoryApiModule.getList();
		await callsHistoryApiModule.getList({
			sort: '+duration',
		});

		expect(getListPost.mock.calls[0][0].data.sort).toBe('-created_at');
		expect(getListPost.mock.calls[1][0].data.sort).toBe('+duration');
	});

	it('requests the whole history up to the end of today when no createdAt filter is set', async () => {
		await callsHistoryApiModule.getList();

		expect(getRequest().data.createdAt).toEqual({
			from: 0,
			to: END_OF_TODAY,
		});
	});

	it('passes an explicit createdAt range as is', async () => {
		await callsHistoryApiModule.getList({
			createdAt: {
				from: 1000,
				to: 2000,
			},
		});

		expect(getRequest().data.createdAt).toEqual({
			from: 1000,
			to: 2000,
		});
	});

	it('fills a missing range end with the end of today', async () => {
		await callsHistoryApiModule.getList({
			createdAt: {
				from: 1000,
			},
		});

		expect(getRequest().data.createdAt).toEqual({
			from: 1000,
			to: END_OF_TODAY,
		});
	});

	it('fills a missing range start with the beginning of history', async () => {
		await callsHistoryApiModule.getList({
			createdAt: {
				to: 2000,
			},
		});

		expect(getRequest().data.createdAt).toEqual({
			from: 0,
			to: 2000,
		});
	});

	it('sends ownerId as an array', async () => {
		await callsHistoryApiModule.getList({
			ownerId: '42',
		});

		expect(getRequest().data.ownerId).toEqual([
			'42',
		]);
	});

	it('sends search as a prefix query in q', async () => {
		await callsHistoryApiModule.getList({
			search: '380',
		});

		expect(getRequest().data).toMatchObject({
			q: '380*',
		});
		expect(getRequest().data).not.toHaveProperty('search');
	});

	it('passes other params through and keeps variables keys unconverted', async () => {
		await callsHistoryApiModule.getList({
			page: 2,
			size: 20,
		});

		expect(getRequest()).toMatchObject({
			data: {
				page: 2,
				size: 20,
			},
			doNotConvertKeys: [
				'variables',
			],
		});
	});

	it('returns the API response', async () => {
		const response = {
			items: [
				{
					id: '1',
				},
			],
			next: true,
		};
		getListPost.mockResolvedValue(response);

		await expect(callsHistoryApiModule.getList()).resolves.toBe(response);
	});
});
