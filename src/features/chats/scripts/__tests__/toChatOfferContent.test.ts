import { describe, expect, it } from 'vitest';
import type { Task } from 'webitel-sdk';

import { OfferKind } from '../../../../ui/notifications/modules/offers/types/Offer.types';
import { toChatOfferContent } from '../toChatOfferContent';

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

describe('toChatOfferContent', () => {
	it('maps an identified contact with the last message', () => {
		expect(toChatOfferContent(buildTask())).toEqual({
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
		const content = toChatOfferContent(
			buildTask({
				displayName: null,
			}),
		);

		expect(content.name).toBeUndefined();
		expect(content.identifier).toBe('@john');
	});

	it('tolerates a task with no thread preview', () => {
		const content = toChatOfferContent(
			buildTask({
				thread: undefined,
			}),
		);

		expect(content.body).toBeUndefined();
	});

	/**
	 * Nothing on `Task` carries the gateway, and the communication type would
	 * read as one while naming the messenger instead. Omitted until WS-35.
	 */
	it('omits the source line until the gateway is on the wire', () => {
		expect(toChatOfferContent(buildTask()).source).toBeUndefined();
	});

	/**
	 * `offeringAt` resets on every redistribution, so a re-offered customer would
	 * restart at zero and the bar would go greener the longer they waited.
	 */
	it('reports no waiting time until a queue-entry epoch exists', () => {
		const content = toChatOfferContent(buildTask());

		expect(content.waitingSince).toBeUndefined();
		expect(content.maxWaitSec).toBeUndefined();
	});
});
