import { describe, expect, it } from 'vitest';
import type { Task } from 'webitel-sdk';

import { isIncomingChatOffer } from '../isIncomingChatOffer';

const buildTask = (overrides: Partial<Task> = {}): Task =>
	({
		id: 1,
		channel: 'im',
		offeringAt: 1_700_000_000_000,
		bridgedAt: 0,
		closedAt: 0,
		...overrides,
	}) as unknown as Task;

describe('isIncomingChatOffer', () => {
	it('offers a chat that has been offered and not yet taken', () => {
		expect(isIncomingChatOffer(buildTask())).toBe(true);
	});

	/**
	 * A task exists from the `distribute` frame, before it is offered to this
	 * agent — `offeringAt` is what marks the offer.
	 */
	it('does not offer a chat that has only been distributed', () => {
		expect(
			isIncomingChatOffer(
				buildTask({
					offeringAt: 0,
				}),
			),
		).toBe(false);
	});

	// `setBridged` records the timestamp and leaves `state` alone
	it('does not offer a chat the agent already took', () => {
		expect(
			isIncomingChatOffer(
				buildTask({
					bridgedAt: 1_700_000_000_100,
				}),
			),
		).toBe(false);
	});

	it('does not offer a closed chat', () => {
		expect(
			isIncomingChatOffer(
				buildTask({
					closedAt: 1_700_000_000_100,
				}),
			),
		).toBe(false);
	});

	/**
	 * Regression: the SDK never sets `state` to `offering` for a chat. It is
	 * assigned in the constructor and immediately overwritten by the event
	 * status, so a live chat task reads `distribute` throughout.
	 */
	it('does not depend on the task state', () => {
		expect(
			isIncomingChatOffer(
				buildTask({
					state: 'distribute',
				} as Partial<Task>),
			),
		).toBe(true);
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
