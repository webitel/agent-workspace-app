import { describe, expect, it, vi } from 'vitest';
import type { Call } from 'webitel-sdk';

import { InteractionKind } from '../../../../ui/notifications/types/IncomingInteraction.types';
import { maskNumber, toIncomingCallPreview } from '../toIncomingCallPreview';

// the shared i18n instance can't be constructed under the global vue-i18n mock
vi.mock('../../../../app/locale/i18n', () => ({
	default: {
		global: {
			t: (key: string) => key,
		},
	},
}));

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		id: 'call-1',
		displayName: 'John Smith',
		displayNumber: '380671234678',
		hideNumber: false,
		hideContact: false,
		createdAt: 1_700_000_000_000,
		queue: null,
		...overrides,
	}) as unknown as Call;

describe('maskNumber', () => {
	it('keeps a constant-width mask regardless of the number length', () => {
		expect(maskNumber('380671234678')).toBe('*****678');
		expect(maskNumber('1234')).toBe('*****234');
	});

	it('exposes nothing when the number is too short to mask', () => {
		expect(maskNumber('678')).toBe('*****');
		expect(maskNumber('1')).toBe('*****');
	});

	it('returns undefined for a missing number', () => {
		expect(maskNumber(undefined)).toBeUndefined();
	});
});

describe('toIncomingCallPreview', () => {
	it('maps an identified contact', () => {
		expect(toIncomingCallPreview(buildCall())).toEqual({
			kind: InteractionKind.Call,
			name: 'John Smith',
			identifier: '380671234678',
			source: undefined,
			waitingSince: 1_700_000_000_000,
			maxWaitSec: undefined,
		});
	});

	// `displayName` is '' when the platform has nothing better than the number
	it('drops the name when the contact was not identified', () => {
		const preview = toIncomingCallPreview(
			buildCall({
				displayName: '',
			}),
		);

		expect(preview.name).toBeUndefined();
		expect(preview.identifier).toBe('380671234678');
	});

	it('fails closed on hideContact even when a name is present', () => {
		const preview = toIncomingCallPreview(
			buildCall({
				hideContact: true,
			}),
		);

		expect(preview.name).toBeUndefined();
	});

	it('masks the number when the call hides it, keeping the name', () => {
		const preview = toIncomingCallPreview(
			buildCall({
				hideNumber: true,
			}),
		);

		expect(preview.name).toBe('John Smith');
		expect(preview.identifier).toBe('*****678');
	});

	it('exposes the queue as the source line', () => {
		const preview = toIncomingCallPreview(
			buildCall({
				queue: {
					queue_name: 'Support',
				},
			} as Partial<Call>),
		);

		expect(preview.source).toEqual({
			label: 'ui.notifications.incoming.queue',
			value: 'Support',
		});
	});

	// the field does not exist on the wire yet (WS-16) — the bar stays hidden
	it('leaves maxWaitSec undefined until the queue exposes it', () => {
		expect(toIncomingCallPreview(buildCall()).maxWaitSec).toBeUndefined();
	});

	it('picks up the queue max wait time as soon as it appears', () => {
		const preview = toIncomingCallPreview(
			buildCall({
				queue: {
					queue_name: 'Support',
					// not on `QueueParameters` yet — this is the field WS-16 should add
					max_wait_time: 120,
				},
			} as unknown as Partial<Call>),
		);

		expect(preview.maxWaitSec).toBe(120);
	});
});
