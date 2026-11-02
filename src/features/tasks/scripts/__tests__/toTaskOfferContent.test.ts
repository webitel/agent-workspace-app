import { describe, expect, it } from 'vitest';
import type { Task } from 'webitel-sdk';

import { OfferKind } from '../../../../ui/notifications/modules/offers/types/Offer.types';
import { toTaskOfferContent } from '../toTaskOfferContent';

const buildTask = (overrides: Record<string, unknown> = {}): Task =>
	({
		id: 1,
		channel: 'task',
		displayName: 'John Smith',
		displayNumber: 'Callback request',
		queue: {
			id: 7,
			name: 'Support',
		},
		memberJoinedAt: 1_700_000_000_000,
		queueMaxWaitTime: 300,
		...overrides,
	}) as unknown as Task;

describe('toTaskOfferContent', () => {
	it('maps the member, their destination, queue and wait', () => {
		expect(toTaskOfferContent(buildTask())).toEqual({
			kind: OfferKind.Task,
			name: 'John Smith',
			destination: 'Callback request',
			source: {
				label: 'Queue',
				value: 'Support',
			},
			waitingSince: 1_700_000_000_000,
			maxWaitSec: 300,
		});
	});

	// `displayName` is null when the platform pushed no member name
	it('drops the name when the member was not identified', () => {
		const content = toTaskOfferContent(
			buildTask({
				displayName: null,
			}),
		);

		expect(content.name).toBeUndefined();
	});

	it('drops the destination when the member has none', () => {
		const content = toTaskOfferContent(
			buildTask({
				displayNumber: '',
			}),
		);

		expect(content.destination).toBeUndefined();
	});

	it('omits the queue line when the queue has no name', () => {
		const content = toTaskOfferContent(
			buildTask({
				queue: {
					id: 7,
					name: '',
				},
			}),
		);

		expect(content.source).toBeUndefined();
	});

	// a wrong number is worse than none: no epoch hides the waiting block
	it('hides the wait when the member has no queue entry time', () => {
		const content = toTaskOfferContent(
			buildTask({
				memberJoinedAt: 0,
			}),
		);

		expect(content.waitingSince).toBeUndefined();
	});

	it.each([
		undefined,
		0,
	])('hides the progress bar for a max wait of %s', (queueMaxWaitTime) => {
		const content = toTaskOfferContent(
			buildTask({
				queueMaxWaitTime,
			}),
		);

		expect(content.maxWaitSec).toBeUndefined();
	});
});
