import { describe, expect, it } from 'vitest';
import { JobState, type Task } from 'webitel-sdk';

import { isIncomingChatOffer } from '../isIncomingChatOffer';

const buildTask = (overrides: Partial<Task> = {}): Task =>
	({
		id: 1,
		channel: 'im',
		state: JobState.Offering,
		...overrides,
	}) as unknown as Task;

describe('isIncomingChatOffer', () => {
	it('offers a chat task in the offering state', () => {
		expect(isIncomingChatOffer(buildTask())).toBe(true);
	});

	it('does not offer a chat the agent already took', () => {
		expect(
			isIncomingChatOffer(
				buildTask({
					state: JobState.Bridged,
				}),
			),
		).toBe(false);
	});

	it('does not offer a chat that was missed or closed', () => {
		for (const state of [
			JobState.Missed,
			JobState.Closed,
			JobState.Processing,
			JobState.Distribute,
		]) {
			expect(
				isIncomingChatOffer(
					buildTask({
						state,
					}),
				),
			).toBe(false);
		}
	});

	it('does not offer a task from another channel', () => {
		expect(
			isIncomingChatOffer(
				buildTask({
					channel: 'call',
				}),
			),
		).toBe(false);
	});

	it('tolerates a missing task', () => {
		expect(isIncomingChatOffer(undefined as unknown as Task)).toBe(false);
	});
});
