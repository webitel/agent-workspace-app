import { describe, expect, it } from 'vitest';
import type { Task } from 'webitel-sdk';

import { isIncomingTaskOffer } from '../isIncomingTaskOffer';

// `allowAccept` is an SDK getter over `channel`, `bridgedAt` and `closedAt`
const buildTask = (overrides: Partial<Task> = {}): Task =>
	({
		id: 1,
		channel: 'task',
		allowAccept: true,
		offeringAt: 1_700_000_000_000,
		...overrides,
	}) as unknown as Task;

describe('isIncomingTaskOffer', () => {
	it('offers a job that has been offered and not yet taken', () => {
		expect(isIncomingTaskOffer(buildTask())).toBe(true);
	});

	it.each([
		'im',
		'call',
	])('ignores a %s task', (channel) => {
		expect(
			isIncomingTaskOffer(
				buildTask({
					channel,
				} as Partial<Task>),
			),
		).toBe(false);
	});

	// a task exists from the `distribute` frame, before it is offered to this agent
	it('does not offer a job that has only been distributed', () => {
		expect(
			isIncomingTaskOffer(
				buildTask({
					offeringAt: 0,
				}),
			),
		).toBe(false);
	});

	it('does not offer a job the agent already took or that was closed', () => {
		expect(
			isIncomingTaskOffer(
				buildTask({
					allowAccept: false,
				} as Partial<Task>),
			),
		).toBe(false);
	});

	it('tolerates a missing task', () => {
		expect(isIncomingTaskOffer(undefined as unknown as Task)).toBe(false);
	});
});
