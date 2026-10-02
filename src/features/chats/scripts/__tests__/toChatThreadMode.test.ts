import { describe, expect, it, vi } from 'vitest';
import type { Task } from 'webitel-sdk';

import { toChatThreadMode } from '../toChatThreadMode';

// the real /v2 entry pulls the ui-sdk asset tree, which vitest cannot transform
vi.mock('@webitel/ui-chats/v2', () => ({
	ChatThreadMode: {
		Awaiting: 'awaiting',
		Active: 'active',
		Readonly: 'readonly',
	},
}));

const buildTask = (overrides: Partial<Task> = {}): Task =>
	({
		id: 1,
		channel: 'im',
		offeringAt: 1_700_000_000_000,
		bridgedAt: 1_700_000_000_100,
		closedAt: 0,
		...overrides,
	}) as unknown as Task;

describe('toChatThreadMode', () => {
	it('previews an incoming offer', () => {
		expect(
			toChatThreadMode(
				buildTask({
					bridgedAt: 0,
				}),
				false,
			),
		).toBe('awaiting');
	});

	it('lets the operator write in a live chat', () => {
		expect(toChatThreadMode(buildTask(), false)).toBe('active');
	});

	it('is read-only once closed or in post-processing', () => {
		expect(
			toChatThreadMode(
				buildTask({
					closedAt: 1_700_000_000_200,
				}),
				false,
			),
		).toBe('readonly');
		expect(toChatThreadMode(buildTask(), true)).toBe('readonly');
	});

	it('is read-only without a task', () => {
		expect(toChatThreadMode(undefined, false)).toBe('readonly');
	});
});
