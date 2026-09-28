import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();

vi.mock('@webitel/api-services/api/defaults', async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	getDefaultInstance: () => ({
		get: (...args: unknown[]) => getMock(...args),
	}),
}));

import { getFormTableRows } from '../formTableRows';

describe('getFormTableRows', () => {
	beforeEach(() => {
		getMock.mockReset();
	});

	it('requests the page, fields and schema filters, and camelCases rows', async () => {
		getMock.mockResolvedValue({
			data: {
				items: [
					{
						common_name: 'Jane',
					},
				],
				next: true,
			},
		});

		const result = await getFormTableRows({
			path: '/contacts',
			filters: [
				'group=vip',
			],
			fields: [
				'common_name',
				'emails',
			],
			page: 2,
		});

		const url = getMock.mock.calls[0][0] as string;
		expect(url.startsWith('/contacts?')).toBe(true);
		expect(url).toContain('page=2');
		expect(url).toContain('fields=common_name');
		expect(url).toContain('fields=emails');
		expect(url).toContain('&group=vip');
		expect(result).toEqual({
			items: [
				{
					commonName: 'Jane',
				},
			],
			next: true,
		});
	});

	it('accepts endpoints that answer with `data`', async () => {
		getMock.mockResolvedValue({
			data: {
				data: [
					{
						id: 1,
					},
				],
			},
		});

		const result = await getFormTableRows({
			path: '/objects',
		});

		expect(result.items).toEqual([
			{
				id: 1,
			},
		]);
	});
});
