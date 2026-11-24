import { describe, expect, it } from 'vitest';

import { toTransferUserRows } from '../toTransferUserRows';

describe('toTransferUserRows', () => {
	it('maps the name, the extension and the status of a user who is an agent', () => {
		expect(
			toTransferUserRows([
				{
					id: '7',
					name: 'John Doe',
					extension: '1001',
					status: 'online',
					presence: {
						status: 'sip',
					},
				},
			]),
		).toEqual([
			{
				id: '7',
				name: 'John Doe',
				extension: '1001',
				status: 'online',
			},
		]);
	});

	it('shows DnD over the agent status', () => {
		expect(
			toTransferUserRows([
				{
					id: '7',
					status: 'online',
					presence: {
						status: 'sip,dnd',
					},
				},
			])[0].status,
		).toBe('dnd');
	});

	it('leaves a user who is not an agent without a status', () => {
		expect(
			toTransferUserRows([
				{
					id: '7',
					name: 'John Doe',
					presence: {
						status: 'sip',
					},
				},
			]),
		).toEqual([
			{
				id: '7',
				name: 'John Doe',
				extension: undefined,
				status: undefined,
			},
		]);
	});

	it('keeps a row for a user without a name', () => {
		expect(
			toTransferUserRows([
				{
					id: '7',
				},
			])[0].name,
		).toBe('');
	});

	it('leaves out a user without an id', () => {
		expect(
			toTransferUserRows([
				{
					name: 'John Doe',
				},
				{
					id: '7',
					name: 'Jane Roe',
				},
			]),
		).toEqual([
			{
				id: '7',
				name: 'Jane Roe',
				extension: undefined,
				status: undefined,
			},
		]);
	});
});
