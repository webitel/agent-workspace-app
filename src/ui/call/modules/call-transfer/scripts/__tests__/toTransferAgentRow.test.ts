import { describe, expect, it } from 'vitest';

import { toTransferAgentRow } from '../toTransferAgentRow';

describe('toTransferAgentRow', () => {
	it('maps the name, the team and the status of an agent', () => {
		expect(
			toTransferAgentRow({
				id: '7',
				name: 'John Doe',
				status: 'online',
				team: {
					name: 'Support',
				},
				userPresenceStatus: {
					status: 'sip',
				},
			}),
		).toEqual({
			id: '7',
			name: 'John Doe',
			teamName: 'Support',
			status: 'online',
		});
	});

	it('keeps a row for an agent without a name, a team or a status', () => {
		expect(
			toTransferAgentRow({
				id: '7',
			}),
		).toEqual({
			id: '7',
			name: '',
			teamName: undefined,
			status: undefined,
		});
	});
});
