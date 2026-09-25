import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();

vi.mock('@webitel/api-services/api/defaults', async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	getDefaultInstance: () => ({
		get: (...args: unknown[]) => getMock(...args),
	}),
}));

import { getObjectLookup } from '../objectLookup';

describe('getObjectLookup', () => {
	beforeEach(() => {
		getMock.mockReset();
	});

	it('queries the object path with search, paging and the schema filters', async () => {
		getMock.mockResolvedValue({
			data: {
				items: [],
			},
		});

		await getObjectLookup({
			path: '/dictionary/cities',
			display: 'name',
			primary: 'id',
			filters: [
				'country=ua',
			],
			search: 'kyi',
			page: 2,
		});

		const url = getMock.mock.calls[0][0] as string;
		expect(url.startsWith('/dictionary/cities?')).toBe(true);
		expect(url).toContain('q=kyi%2A');
		expect(url).toContain('page=2');
		expect(url).toContain('size=10');
		expect(url).toContain('&country=ua');
	});

	it('maps records to id/name by primary and a display template', async () => {
		getMock.mockResolvedValue({
			data: {
				data: [
					{
						code: 7,
						name: 'Kyiv',
						region: {
							name: 'Kyiv oblast',
						},
					},
				],
				next: true,
			},
		});

		const result = await getObjectLookup({
			path: '/dictionary/cities',
			display: '{name} ({region.name}, {missing})',
			primary: 'code',
		});

		expect(result.next).toBe(true);
		expect(result.items[0]).toMatchObject({
			id: 7,
			name: 'Kyiv (Kyiv oblast, {missing})',
		});
	});

	it('reads a plain dot-path display from `items` responses', async () => {
		getMock.mockResolvedValue({
			data: {
				items: [
					{
						id: 'a',
						profile: {
							title: 'Alpha',
						},
					},
				],
			},
		});

		const result = await getObjectLookup({
			path: '/objects',
			display: 'profile.title',
			primary: 'id',
		});

		expect(result.items[0].name).toBe('Alpha');
	});
});
