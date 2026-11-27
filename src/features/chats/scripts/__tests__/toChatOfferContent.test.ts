import { describe, expect, it, vi } from 'vitest';
import type { Task } from 'webitel-sdk';

import { OfferKind } from '../../../../ui/notifications/modules/offers/types/Offer.types';
import { toChatOfferContent } from '../toChatOfferContent';

// the shared i18n instance can't be constructed under the global vue-i18n mock
vi.mock('../../../../app/locale/i18n', () => ({
	default: {
		global: {
			t: (key: string) => key,
		},
	},
}));

const buildTask = (overrides: Partial<Task> = {}): Task =>
	({
		id: 1,
		channel: 'im',
		displayName: 'John Smith',
		displayNumber: '@john',
		communication: {},
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

	it('prefers the thread subject over the member name', () => {
		const content = toChatOfferContent(
			buildTask({
				displayName: '191',
				thread: {
					id: 'thread-1',
					subject: 'Liza Test',
				},
			}),
		);

		expect(content.name).toBe('Liza Test');
	});

	it('drops the identifier when it only repeats the name', () => {
		const content = toChatOfferContent(
			buildTask({
				displayName: '191',
				displayNumber: '191',
			}),
		);

		expect(content.name).toBe('191');
		expect(content.identifier).toBeUndefined();
	});

	it('maps the schema variables in their own order', () => {
		const content = toChatOfferContent(
			buildTask({
				variables: {
					Language: 'EN',
					attempts: 2,
				},
			}),
		);

		expect(content.variables).toEqual([
			{
				label: 'Language',
				value: 'EN',
			},
			{
				label: 'attempts',
				value: '2',
			},
		]);
	});

	// AC_06.01.06: no variables, no variables block
	it('drops the variables when the task has none', () => {
		const content = toChatOfferContent(
			buildTask({
				variables: {},
			}),
		);

		expect(content.variables).toBeUndefined();
	});

	it('tolerates a task with no thread preview', () => {
		const content = toChatOfferContent(
			buildTask({
				thread: undefined,
			}),
		);

		expect(content.body).toBeUndefined();
	});

	it('maps the gateway name from the thread channel', () => {
		const task = buildTask({
			communication: {
				thread: {
					channel: {
						name: 'illia bot',
						type: 'portal',
					},
				},
			} as unknown as Task['communication'],
		});

		expect(toChatOfferContent(task).source).toEqual({
			label: 'ui.notifications.offer.channel',
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
