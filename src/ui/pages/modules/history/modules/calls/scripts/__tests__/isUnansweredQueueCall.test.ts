import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { describe, expect, it } from 'vitest';
import { CallDirection } from 'webitel-sdk';

import { isUnansweredQueueCall } from '../isUnansweredQueueCall';

const queue = {
	id: '335',
	name: 'Support queue',
};

describe('isUnansweredQueueCall', () => {
	it('is true for an outbound queue call no operator picked up', () => {
		expect(
			isUnansweredQueueCall({
				direction: CallDirection.Outbound,
				queue,
			} as EngineHistoryCall),
		).toBe(true);
	});

	it('is false once an operator answered the queue call', () => {
		expect(
			isUnansweredQueueCall({
				direction: CallDirection.Outbound,
				queue,
				bridgedAt: '1790947707140',
			} as EngineHistoryCall),
		).toBe(false);
	});

	it('is false for a plain outbound call without a queue', () => {
		expect(
			isUnansweredQueueCall({
				direction: CallDirection.Outbound,
			} as EngineHistoryCall),
		).toBe(false);
	});

	it('is false for an inbound queue call', () => {
		expect(
			isUnansweredQueueCall({
				direction: CallDirection.Inbound,
				queue,
			} as EngineHistoryCall),
		).toBe(false);
	});
});
