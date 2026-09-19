import { describe, expect, it } from 'vitest';
import type { Task } from 'webitel-sdk';

import { OfferKind } from '../../../../ui/notifications/modules/offers/types/Offer.types';
import { toIncomingChatPreview } from '../toIncomingChatPreview';

const buildTask = (overrides: Partial<Task> = {}): Task =>
	({
		id: 1,
		channel: 'im',
		displayName: 'John Smith',
		displayNumber: '@john',
		thread: {
			id: 'thread-1',
			lastMsg: 'is anyone there?',
		},
		...overrides,
	}) as unknown as Task;

describe('toIncomingChatPreview', () => {
	it('maps an identified contact with the last message', () => {
		expect(toIncomingChatPreview(buildTask())).toEqual({
			kind: OfferKind.Chat,
			name: 'John Smith',
			identifier: '@john',
			source: undefined,
			body: 'is anyone there?',
			waitingSince: undefined,
			maxWaitSec: undefined,
		});
	});

	// `displayName` is null when the platform pushed no member name
	it('drops the name when the contact was not identified', () => {
		const preview = toIncomingChatPreview(
			buildTask({
				displayName: null,
			}),
		);

		expect(preview.name).toBeUndefined();
		expect(preview.identifier).toBe('@john');
	});

	it('tolerates a task with no thread preview', () => {
		const preview = toIncomingChatPreview(
			buildTask({
				thread: undefined,
			}),
		);

		expect(preview.body).toBeUndefined();
	});

	/**
	 * Nothing on `Task` carries the gateway, and the communication type would
	 * read as one while naming the messenger instead. Omitted until WS-35.
	 */
	it('omits the source line until the gateway is on the wire', () => {
		expect(toIncomingChatPreview(buildTask()).source).toBeUndefined();
	});

	/**
	 * `offeringAt` resets on every redistribution, so a re-offered customer would
	 * restart at zero and the bar would go greener the longer they waited.
	 */
	it('reports no waiting time until a queue-entry epoch exists', () => {
		const preview = toIncomingChatPreview(buildTask());

		expect(preview.waitingSince).toBeUndefined();
		expect(preview.maxWaitSec).toBeUndefined();
	});
});
