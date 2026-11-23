import { describe, expect, it } from 'vitest';

import { toTransferAgentRows } from '../toTransferAgentRows';

describe('toTransferAgentRows', () => {
	it('maps the name, the team and the status of an agent', () => {
		expect(
			toTransferAgentRows([
				{
					id: '7',
					name: 'John Doe',
					status: 'online',
					team: {
						name: 'Support',
					},
					userPresenceStatus: {
						status: 'sip',
					},
				},
			]),
		).toEqual([
			{
				id: '7',
				name: 'John Doe',
				teamName: 'Support',
				status: 'online',
			},
		]);
	});

	it('keeps a row for an agent without a name, a team or a status', () => {
		expect(
			toTransferAgentRows([
				{
					id: '7',
				},
			]),
		).toEqual([
			{
				id: '7',
				name: '',
				teamName: undefined,
				status: undefined,
			},
		]);
	});

	it('leaves out an agent without an id', () => {
		expect(
			toTransferAgentRows([
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
				teamName: undefined,
				status: undefined,
			},
		]);
	});
});
