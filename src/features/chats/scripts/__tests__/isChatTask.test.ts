import { describe, expect, it } from 'vitest';
import type { Task } from 'webitel-sdk';

import { isChatTask } from '../isChatTask';

const buildTask = (channel: string): Task =>
	({
		id: 1,
		channel,
	}) as unknown as Task;

describe('isChatTask', () => {
	it('accepts an im task', () => {
		expect(isChatTask(buildTask('im'))).toBe(true);
	});

	// the SDK multiplexes calls, chats and jobs through one feed
	it('rejects other channels', () => {
		expect(isChatTask(buildTask('call'))).toBe(false);
		expect(isChatTask(buildTask('task'))).toBe(false);
	});

	it('tolerates a missing task', () => {
		expect(isChatTask(undefined as unknown as Task)).toBe(false);
	});
});
