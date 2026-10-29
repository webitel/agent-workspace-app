import { describe, expect, it } from 'vitest';

import { TransferAgentStatus } from '../../enums/TransferAgentStatus.enum';
import { getTransferAgentStatus } from '../getTransferAgentStatus';

describe('getTransferAgentStatus', () => {
	it.each([
		'online',
		'pause',
		'break_out',
		'offline',
	])('shows the agent status %s as it is', (agentStatus) => {
		expect(
			getTransferAgentStatus({
				agentStatus,
			}),
		).toBe(agentStatus);
	});

	it('shows DnD over the agent status, an online agent can be DnD', () => {
		expect(
			getTransferAgentStatus({
				agentStatus: 'online',
				presenceStatus: 'dnd',
			}),
		).toBe(TransferAgentStatus.Dnd);
	});

	it('ignores a presence other than DnD', () => {
		expect(
			getTransferAgentStatus({
				agentStatus: 'pause',
				presenceStatus: 'sip',
			}),
		).toBe(TransferAgentStatus.Pause);
	});

	it('leaves the status absent when the agent status is unknown or missing', () => {
		expect(
			getTransferAgentStatus({
				agentStatus: 'waiting',
			}),
		).toBeUndefined();
		expect(getTransferAgentStatus({})).toBeUndefined();
	});
});
