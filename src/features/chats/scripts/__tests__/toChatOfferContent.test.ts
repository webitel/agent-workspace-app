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
		offeringAt: 1_700_000_000_000,
		acceptTimeoutSec: 20,
		...overrides,
	}) as unknown as Task;

describe('toChatOfferContent', () => {
	it('maps an identified contact with the last message', () => {
		expect(toChatOfferContent(buildTask())).toEqual({
			kind: OfferKind.Chat,
			name: 'John Smith',
			identifier: '@john',
			source: undefined,
			queueName: undefined,
			body: 'is anyone there?',
			waitingSince: 1_700_000_000_000,
			maxWaitSec: 20,
			isCountdown: true,
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

	it('maps the gateway name from the raw distribute event', () => {
		const task = buildTask() as unknown as {
			distribute: {
				communication: {
					thread: {
						channel: {
							name: string;
							type: string;
						};
					};
				};
			};
		};
		task.distribute = {
			communication: {
				thread: {
					channel: {
						name: 'illia bot',
						type: 'portal',
					},
				},
			},
		};

		expect(toChatOfferContent(task as unknown as Task).source).toEqual({
			label: 'Channel',
			value: 'illia bot',
		});
	});

	it('exposes the queue the chat came through', () => {
		const content = toChatOfferContent(
			buildTask({
				queue: {
					id: 7,
					name: 'Support',
				},
			}),
		);

		expect(content.queueName).toBe('Support');
	});

	it('hides the countdown until the SDK exposes its start and timeout', () => {
		const content = toChatOfferContent(
			buildTask({
				offeringAt: 0,
				acceptTimeoutSec: 0,
			}),
		);

		expect(content.waitingSince).toBeUndefined();
		expect(content.maxWaitSec).toBeUndefined();
	});
});
